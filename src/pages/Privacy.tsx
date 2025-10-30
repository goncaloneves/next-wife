import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8" data-testid="button-back">
            ← Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Introduction</h2>
            <p>
              Next Wife ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard your information when you use our AI companion service through Telegram.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Telegram user ID and username</li>
              <li>Messages and conversations with AI companions</li>
              <li>Photos and media you share</li>
              <li>Preferences and customization choices</li>
              <li>Payment information (processed through Telegram)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Usage data and interaction patterns</li>
              <li>Device information and IP addresses</li>
              <li>Session timestamps and duration</li>
              <li>Technical data for service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and personalize AI companion experiences</li>
              <li>Maintain conversation context for better responses</li>
              <li>Process payments and manage subscriptions</li>
              <li>Communicate service updates and features</li>
              <li>Ensure service security and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Message Usage and Privacy</h2>
            <p>
              <strong>We do NOT use your messages for AI training.</strong> Your conversations are used exclusively for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing contextual responses during your conversations</li>
              <li>Maintaining conversation history for continuity</li>
              <li>Personalizing your AI companion experience</li>
            </ul>
            <p className="mt-4">
              Your private conversations remain private and are never used to train AI models or shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Storage and Security</h2>
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Secure cloud storage with Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Limited employee access to user data</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Data Retention</h2>
            <p>
              We retain your data for as long as necessary to provide the Service and comply with legal obligations. 
              Conversation history may be stored for service continuity and personalization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Telegram:</strong> For service delivery and payments</li>
              <li><strong>Supabase:</strong> For data storage and backend services</li>
              <li><strong>AI Providers:</strong> For generating companion responses and content</li>
            </ul>
            <p className="mt-4">
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request data deletion</li>
              <li>Correct inaccurate information</li>
              <li>Object to certain data processing</li>
              <li>Data portability</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us through our Telegram bot.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Children's Privacy</h2>
            <p>
              Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information 
              from minors. If you believe a minor has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. By using our Service, you 
              consent to such transfers. We ensure appropriate safeguards are in place for international data transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Cookies and Tracking</h2>
            <p>
              Our website uses minimal cookies for essential functionality. We do not use extensive tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes through the Service 
              or via Telegram. Your continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or want to exercise your privacy rights, contact us:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>
                <strong>Telegram:</strong>{" "}
                <a 
                  href="https://t.me/nextwifebot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @nextwifebot
                </a>
              </li>
              <li><strong>Location:</strong> Made in Bali 🌺</li>
            </ul>
          </section>

          <section className="mt-12 p-6 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> Next Wife is an AI-powered entertainment service. All companions are artificial intelligence 
              and not real people. We prioritize your privacy and data security while providing an engaging experience.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
