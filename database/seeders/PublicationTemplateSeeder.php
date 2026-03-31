<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PublicationTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Promotional Templates
            [
                'name' => 'Product Launch Announcement',
                'description' => 'Perfect for announcing new products or services with excitement and clear call-to-action',
                'category' => 'promotional',
                'preview_image' => '/images/templates/product-launch.jpg',
                'content' => [
                    'text' => "🚀 Exciting News! We're thrilled to announce [Product Name]!\n\n✨ [Key Feature 1]\n✨ [Key Feature 2]\n✨ [Key Feature 3]\n\nAvailable now! Link in bio 👆",
                    'hashtags' => ['#NewProduct', '#Launch', '#Innovation'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Limited Time Offer',
                'description' => 'Create urgency with time-sensitive promotions and special deals',
                'category' => 'promotional',
                'preview_image' => '/images/templates/limited-offer.jpg',
                'content' => [
                    'text' => "⏰ FLASH SALE ALERT! ⏰\n\nGet [X]% OFF on [Product/Service]\n\n🎯 Offer ends: [Date]\n💰 Use code: [PROMO_CODE]\n\nDon't miss out! Shop now 🛍️",
                    'hashtags' => ['#Sale', '#LimitedOffer', '#Deal'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Event Promotion',
                'description' => 'Promote upcoming events, webinars, or workshops with all essential details',
                'category' => 'promotional',
                'preview_image' => '/images/templates/event-promo.jpg',
                'content' => [
                    'text' => "📅 Save the Date!\n\n[Event Name]\n📍 [Location/Platform]\n🗓️ [Date & Time]\n\n[Brief description of what attendees will learn/experience]\n\n🎟️ Register now: [Link]",
                    'hashtags' => ['#Event', '#Workshop', '#JoinUs'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],

            // Educational Templates
            [
                'name' => 'How-To Guide',
                'description' => 'Share step-by-step instructions and valuable knowledge with your audience',
                'category' => 'educational',
                'preview_image' => '/images/templates/how-to.jpg',
                'content' => [
                    'text' => "📚 How to [Achieve Goal]:\n\nStep 1: [First Action]\nStep 2: [Second Action]\nStep 3: [Third Action]\nStep 4: [Fourth Action]\n\n Pro Tip: [Additional insight]\n\nSave this for later! 🔖",
                    'hashtags' => ['#HowTo', '#Tutorial', '#Tips'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Industry Insights',
                'description' => 'Share expert knowledge and trends in your industry',
                'category' => 'educational',
                'preview_image' => '/images/templates/insights.jpg',
                'content' => [
                    'text' => "🔍 Industry Insight:\n\n[Key Trend or Finding]\n\nWhat this means for you:\n• [Impact Point 1]\n• [Impact Point 2]\n• [Impact Point 3]\n\nStay ahead of the curve! 📈",
                    'hashtags' => ['#IndustryNews', '#Insights', '#Trends'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Quick Tips',
                'description' => 'Share bite-sized, actionable advice your audience can implement immediately',
                'category' => 'educational',
                'preview_image' => '/images/templates/quick-tips.jpg',
                'content' => [
                    'text' => " Quick Tip Tuesday!\n\n[Specific actionable tip]\n\nWhy it works:\n[Brief explanation]\n\nTry it today and let us know how it goes! 👇",
                    'hashtags' => ['#TipTuesday', '#QuickTip', '#LifeHack'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Did You Know?',
                'description' => 'Share interesting facts and statistics to educate and engage',
                'category' => 'educational',
                'preview_image' => '/images/templates/did-you-know.jpg',
                'content' => [
                    'text' => "🤔 Did You Know?\n\n[Interesting Fact or Statistic]\n\n[Brief explanation or context]\n\nWhat surprises you most about this? Comment below! 💬",
                    'hashtags' => ['#DidYouKnow', '#Facts', '#Learning'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],

            // Engagement Templates
            [
                'name' => 'Question of the Day',
                'description' => 'Spark conversations and boost engagement with thought-provoking questions',
                'category' => 'engagement',
                'preview_image' => '/images/templates/question.jpg',
                'content' => [
                    'text' => "❓ Question of the Day:\n\n[Engaging question related to your niche]\n\nWe'd love to hear your thoughts! Drop your answer in the comments 👇\n\n#CommunityFirst",
                    'hashtags' => ['#QOTD', '#Community', '#LetsTalk'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Poll Post',
                'description' => 'Gather opinions and increase interaction with polls',
                'category' => 'engagement',
                'preview_image' => '/images/templates/poll.jpg',
                'content' => [
                    'text' => "🗳️ We need your input!\n\n[Poll Question]\n\nA) [Option 1]\nB) [Option 2]\nC) [Option 3]\n\nVote in the comments! Your opinion matters 💭",
                    'hashtags' => ['#Poll', '#YourOpinion', '#Vote'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Behind the Scenes',
                'description' => 'Build connection by sharing authentic moments from your business',
                'category' => 'engagement',
                'preview_image' => '/images/templates/bts.jpg',
                'content' => [
                    'text' => "👀 Behind the Scenes\n\n[Description of what's happening]\n\nWe love sharing the real moments that make our work special. What would you like to see more of? 💬",
                    'hashtags' => ['#BTS', '#BehindTheScenes', '#Authentic'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'User Generated Content',
                'description' => 'Showcase customer stories and build community trust',
                'category' => 'engagement',
                'preview_image' => '/images/templates/ugc.jpg',
                'content' => [
                    'text' => "⭐ Customer Spotlight!\n\nLook at this amazing [result/creation] from @[username]!\n\n[Brief description or testimonial]\n\nTag us in your posts for a chance to be featured! 📸",
                    'hashtags' => ['#CustomerLove', '#Community', '#Featured'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Motivational Monday',
                'description' => 'Inspire your audience with uplifting content to start the week',
                'category' => 'engagement',
                'preview_image' => '/images/templates/motivation.jpg',
                'content' => [
                    'text' => "💪 Monday Motivation\n\n\"[Inspirational Quote]\"\n\nLet's make this week amazing! What's one goal you're working towards? Share below 👇",
                    'hashtags' => ['#MondayMotivation', '#Inspiration', '#Goals'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],

            // Additional Templates
            [
                'name' => 'Testimonial Showcase',
                'description' => 'Highlight positive customer feedback and build social proof',
                'category' => 'promotional',
                'preview_image' => '/images/templates/testimonial.jpg',
                'content' => [
                    'text' => "💬 What Our Customers Say:\n\n\"[Customer Testimonial]\"\n\n- [Customer Name], [Title/Company]\n\n⭐⭐⭐⭐⭐\n\nReady to experience the same results? [Call to Action]",
                    'hashtags' => ['#Testimonial', '#CustomerReview', '#SocialProof'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Milestone Celebration',
                'description' => 'Celebrate achievements and thank your community',
                'category' => 'engagement',
                'preview_image' => '/images/templates/milestone.jpg',
                'content' => [
                    'text' => "🎉 We Did It!\n\nWe just hit [Milestone Number] [followers/customers/sales]!\n\nThis wouldn't be possible without YOU. Thank you for being part of our journey! 🙏\n\n[Optional: Special offer or giveaway to celebrate]",
                    'hashtags' => ['#Milestone', '#ThankYou', '#Grateful'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
            [
                'name' => 'Weekly Recap',
                'description' => 'Summarize the week\'s highlights and keep your audience updated',
                'category' => 'educational',
                'preview_image' => '/images/templates/recap.jpg',
                'content' => [
                    'text' => "📝 This Week's Highlights:\n\n✅ [Achievement/Update 1]\n✅ [Achievement/Update 2]\n✅ [Achievement/Update 3]\n\nNext week: [Teaser for upcoming content]\n\nWhat was your favorite moment? 💭",
                    'hashtags' => ['#WeeklyRecap', '#Updates', '#ThisWeek'],
                ],
                'is_active' => true,
                'usage_count' => 0,
            ],
        ];

        foreach ($templates as $template) {
            DB::table('publication_templates')->insert([
                'name' => $template['name'],
                'description' => $template['description'],
                'category' => $template['category'],
                'preview_image' => $template['preview_image'],
                'content' => json_encode($template['content']),
                'is_active' => $template['is_active'],
                'usage_count' => $template['usage_count'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Successfully seeded ' . count($templates) . ' publication templates!');
    }
}
