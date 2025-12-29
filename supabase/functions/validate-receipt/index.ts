import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================
// AI RECEIPT VALIDATION EDGE FUNCTION
// =============================================
// Validates payment receipts using Claude Vision API
// Updates booking payment_verification status asynchronously

interface ValidationRequest {
    bookingId: string;
    receiptUrl: string;
}

interface ValidationResult {
    valid: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    details: {
        isReceipt: boolean;
        hasAmount: boolean;
        hasDate: boolean;
        hasMerchant: boolean;
        imageQuality: 'good' | 'fair' | 'poor';
    };
}

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log('🤖 AI Receipt Validation Started');

        // Get Claude API key from environment (NEVER hardcoded!)
        const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
        if (!claudeApiKey) {
            throw new Error('CLAUDE_API_KEY not configured in environment variables');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Parse request body
        const { bookingId, receiptUrl }: ValidationRequest = await req.json();

        if (!bookingId || !receiptUrl) {
            throw new Error('Missing required fields: bookingId and receiptUrl');
        }

        console.log(`📋 Validating receipt for booking: ${bookingId}`);
        console.log(`🔗 Receipt URL: ${receiptUrl}`);

        // Step 1: Download receipt image from Supabase storage
        console.log('⬇️ Downloading receipt image...');
        const imageResponse = await fetch(receiptUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to download receipt: ${imageResponse.statusText}`);
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = btoa(
            new Uint8Array(imageBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ''
            )
        );

        console.log('✅ Image downloaded and converted to base64');

        // Step 2: Call Claude Vision API for validation
        console.log('🔍 Analyzing receipt with Claude AI...');

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: 'image/jpeg',
                                    data: base64Image,
                                },
                            },
                            {
                                type: 'text',
                                text: `Analyze this image and determine if it is a valid payment receipt or proof of payment. 

Please evaluate:
1. Is this a legitimate payment receipt/proof (bank transfer, QR payment, etc.)?
2. Does it contain transaction details like amount, date, and merchant/bank name?
3. Is the image quality good enough to read the details?
4. Is this a real receipt or could it be fake/manipulated?

Respond in JSON format with:
{
  "isReceipt": boolean,
  "hasAmount": boolean,
  "hasDate": boolean,
  "hasMerchant": boolean,
  "imageQuality": "good" | "fair" | "poor",
  "confidence": "high" | "medium" | "low",
  "reason": "Brief explanation of your assessment"
}

Be strict in your evaluation. If you're unsure or the image doesn't clearly show payment details, mark confidence as low.`,
                            },
                        ],
                    },
                ],
            }),
        });

        if (!claudeResponse.ok) {
            const errorText = await claudeResponse.text();
            throw new Error(`Claude API error: ${claudeResponse.status} - ${errorText}`);
        }

        const claudeData = await claudeResponse.json();
        console.log('✅ Claude AI analysis complete');

        // Parse Claude's response
        const aiResponse = claudeData.content[0].text;
        console.log('📊 AI Response:', aiResponse);

        // Extract JSON from response (Claude sometimes wraps it in markdown)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        // Step 3: Determine validation result
        const validation: ValidationResult = {
            valid: analysis.isReceipt && analysis.hasAmount && analysis.confidence !== 'low',
            confidence: analysis.confidence,
            reason: analysis.reason,
            details: {
                isReceipt: analysis.isReceipt,
                hasAmount: analysis.hasAmount,
                hasDate: analysis.hasDate,
                hasMerchant: analysis.hasMerchant,
                imageQuality: analysis.imageQuality,
            },
        };

        console.log('📈 Validation Result:', validation);

        // Step 4: Determine payment verification status
        let newStatus: string;
        if (validation.valid && validation.confidence === 'high') {
            newStatus = 'disahkan_oleh_ai';
            console.log('✅ Receipt VERIFIED by AI');
        } else if (!validation.valid || validation.confidence === 'low') {
            newStatus = 'diragui_oleh_ai';
            console.log('⚠️ Receipt FLAGGED by AI');
        } else {
            // Medium confidence - keep as belum_disahkan for manual review
            newStatus = 'belum_disahkan';
            console.log('⏸️ Receipt requires manual review (medium confidence)');
        }

        // Step 5: Update booking in database
        console.log(`💾 Updating booking status to: ${newStatus}`);

        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_verification: newStatus,
                ai_validation_result: validation,
                ai_validated_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

        if (updateError) {
            throw new Error(`Failed to update booking: ${updateError.message}`);
        }

        console.log('✅ Booking updated successfully');
        console.log('🎉 AI Receipt Validation Complete');

        return new Response(
            JSON.stringify({
                success: true,
                validation,
                status: newStatus,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    } catch (error: any) {
        console.error('❌ Error in AI receipt validation:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error',
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
