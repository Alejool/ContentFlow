import re

dev_seeder_path = 'c:/Users/Olart/OneDrive/Desktop/contenflow/database/seeders/DevSeeder.php'
existing_seeder_path = 'c:/Users/Olart/OneDrive/Desktop/contenflow/database/seeders/ExistingUserDummyDataSeeder.php'

with open(existing_seeder_path, 'r', encoding='utf-8') as f:
    existing_content = f.read()

with open(dev_seeder_path, 'r', encoding='utf-8') as f:
    dev_content = f.read()

# Extract methods from ExistingUserDummyDataSeeder
pub_match = re.search(r'private function createPublicationsAndAnalytics.*?(?=private function generateCampaignAnalytics)', existing_content, re.DOTALL)
pub_code = pub_match.group(0)

camp_match = re.search(r'private function generateCampaignAnalytics.*?(?=private function createSocialAccountsAndMetrics)', existing_content, re.DOTALL)
camp_code = camp_match.group(0)

met_match = re.search(r'private function generateSocialMetrics.*?(?=\n})', existing_content, re.DOTALL)
met_code = met_match.group(0)

# Update DevSeeder imports
imports = '''use App\\Models\\Publications\\Publication;
use App\\Models\\Campaigns\\CampaignAnalytics;
use App\\Models\\Social\\SocialMediaMetrics;
use Illuminate\\Support\\Facades\\Schema;
use Illuminate\\Support\\Facades\\DB;'''

dev_content = re.sub(r'(use App\\Models\\User;)', r'\1\n' + imports, dev_content)

# Update run() method - replacing the ExistingUserDummyDataSeeder call
old_call = r"        // ── 7\. Datos dummy completos.*?\n        \$this->call\(ExistingUserDummyDataSeeder::class\);"

new_call = '''        // ── 7. Publicaciones y Métricas Sociales ───────────────────────
        $this->command->info('▶  Generando publicaciones dummy y métricas...');
        $this->createPublicationsAndAnalytics($user, $workspaceId);
        
        $this->command->info('▶  Generando métricas sociales...');
        $accounts = SocialAccount::where('user_id', $user->id)->get();
        foreach ($accounts as $account) {
            $base = match($account->platform) {
                'facebook' => 4820,
                'instagram' => 12340,
                'twitter' => 3210,
                'tiktok' => 8900,
                'youtube' => 2150,
                default => 5000,
            };
            $this->generateSocialMetrics($account, $base);
        }'''

dev_content = re.sub(old_call, new_call, dev_content, flags=re.DOTALL)

# Append methods before the last closing brace
methods = f"\n\n    {pub_code}\n    {camp_code}\n    {met_code}\n"

dev_content = dev_content.rstrip()
if dev_content.endswith('}'):
    dev_content = dev_content[:-1] + methods + '}'

with open(dev_seeder_path, 'w', encoding='utf-8') as f:
    f.write(dev_content)
print('Done!')
