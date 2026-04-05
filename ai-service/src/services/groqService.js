const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate ad copy using Groq
 */
async function generateAdCopy({ product, tone, platform, word_limit }) {
    const prompt = `You are an expert advertising copywriter. Create compelling ad copy for ${product}.
    
Requirements:
- Tone: ${tone} (e.g., professional, humorous, emotional, urgent)
- Platform: ${platform} (e.g., Facebook, Google, LinkedIn, Instagram)
- Word limit: approximately ${word_limit} words

Generate a response in this EXACT JSON format:
{
    "headline": "Catchy headline here",
    "body": "Main ad body text here with compelling message",
    "cta": "Call to action here (e.g., Shop Now, Learn More, Sign Up)"
}

Make it creative, engaging, and tailored to the platform.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are an expert advertising copywriter. Always respond with valid JSON only, no other text."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.7,
            max_tokens: 500,
        });

        const response = completion.choices[0]?.message?.content;
        // Parse the JSON response
        return JSON.parse(response);
    } catch (error) {
        console.error('Groq API error:', error);
        // Fallback response if API fails
        return {
            headline: "Limited Time Offer!",
            body: `Discover amazing ${product} deals today. Perfect for ${tone} marketing on ${platform}.`,
            cta: "Shop Now"
        };
    }
}

/**
 * Generate social media captions
 */
async function generateSocialCaptions({ platform, campaign_goal, brand_voice }) {
    const prompt = `Create 5 engaging social media captions for ${platform}.
    
Campaign Goal: ${campaign_goal}
Brand Voice: ${brand_voice}

Return as a JSON array of strings, like this:
["Caption 1", "Caption 2", "Caption 3", "Caption 4", "Caption 5"]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a social media expert. Return only valid JSON array of 5 captions."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.8,
            max_tokens: 400,
        });

        const response = completion.choices[0]?.message?.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('Groq API error:', error);
        return [
            `🔥 Exciting news! Check out our latest ${campaign_goal} campaign!`,
            `🚀 Big things are happening! Join us for this ${campaign_goal} journey.`,
            `💫 You won't want to miss this! ${campaign_goal} at its best.`,
            `✨ Transforming the way you think about ${campaign_goal}.`,
            `🎯 Ready to achieve your ${campaign_goal} goals? Let's go!`
        ];
    }
}

/**
 * Generate hashtags
 */
async function generateHashtags({ content, industry }) {
    const prompt = `Generate 10 relevant, trending hashtags for ${industry} industry content about: ${content}

Return as a JSON array of strings, like this:
["#Hashtag1", "#Hashtag2", ...]`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a social media hashtag expert. Return only valid JSON array of 10 hashtags."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "mixtral-8x7b-32768",
            temperature: 0.6,
            max_tokens: 300,
        });

        const response = completion.choices[0]?.message?.content;
        return JSON.parse(response);
    } catch (error) {
        console.error('Groq API error:', error);
        return [
            `#${industry}Marketing`, `#${content.replace(/ /g, '')}`, `#DigitalAgency`,
            `#MarketingTips`, `#SocialMediaStrategy`, `#ContentCreation`,
            `#BrandGrowth`, `#MarketingTrends`, `#AgencyLife`, `#CampaignSuccess`
        ];
    }
}

module.exports = {
    generateAdCopy,
    generateSocialCaptions,
    generateHashtags
};