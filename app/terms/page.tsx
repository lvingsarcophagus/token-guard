"use client"

import Link from "next/link"
import { Shield, ArrowLeft, FileText, AlertTriangle, Scale, UserCheck } from "lucide-react"
import { theme } from "@/lib/theme"

export default function TermsOfServicePage() {
  return (
    <div className={`relative min-h-screen ${theme.backgrounds.main} overflow-hidden`}>
      {/* Stars background */}
      <div className="fixed inset-0 stars-bg pointer-events-none"></div>

      {/* Corner frame accents */}
      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-white/30 z-20"></div>
      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-white/30 z-20"></div>

      <div className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 font-mono text-sm">
          <ArrowLeft className="w-4 h-4" />
          BACK TO HOME
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="w-10 h-10 text-white" />
            <h1 className={`${theme.text.hero} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
              TERMS OF SERVICE
            </h1>
          </div>
          <div className="flex items-center gap-2 text-white/60 font-mono text-xs mb-4">
            <span>LAST UPDATED: NOVEMBER 10, 2025</span>
          </div>
          <p className={`${theme.text.base} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
            Welcome to TokenGuard. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Acceptance of Terms */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                1. ACCEPTANCE OF TERMS
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              By creating an account, accessing, or using TokenGuard ("Service," "Platform," "we," "us," or "our"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you may not use our Service.
            </p>
          </section>

          {/* Section 2: Service Description */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                2. SERVICE DESCRIPTION
              </h2>
            </div>

            <div className="space-y-4">
              <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
                TokenGuard provides cryptocurrency token analysis, risk assessment, and security insights. Our services include:
              </p>

              <ul className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} space-y-2 ml-4`}>
                <li>• Token risk scoring and analysis</li>
                <li>• Security vulnerability detection</li>
                <li>• Market data aggregation</li>
                <li>• Portfolio tracking and alerts</li>
                <li>• Historical analytics (Premium)</li>
                <li>• API access (Premium)</li>
              </ul>
            </div>
          </section>

          {/* Section 3: User Accounts */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                3. USER ACCOUNTS
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  3.1 Account Creation
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4`}>
                  You must provide accurate, complete, and current information during registration. You are responsible for maintaining the security of your account credentials.
                </p>
              </div>

              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  3.2 Account Responsibility
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4`}>
                  You are solely responsible for all activities under your account. Notify us immediately of any unauthorized access or security breaches.
                </p>
              </div>

              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  3.3 Age Requirement
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4`}>
                  You must be at least 18 years old to use TokenGuard. By using our Service, you represent that you meet this requirement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                4. ACCEPTABLE USE
              </h2>
            </div>

            <div className="space-y-4">
              <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
                You agree NOT to:
              </p>

              <ul className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} space-y-2 ml-4`}>
                <li>• Violate any laws or regulations</li>
                <li>• Infringe on intellectual property rights</li>
                <li>• Transmit malware, viruses, or harmful code</li>
                <li>• Attempt to gain unauthorized access to our systems</li>
                <li>• Scrape, crawl, or abuse our API beyond rate limits</li>
                <li>• Use the Service for fraudulent or illegal activities</li>
                <li>• Impersonate others or provide false information</li>
                <li>• Resell or redistribute our data without permission</li>
                <li>• Reverse engineer or decompile our software</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Disclaimer */}
          <section className={`border-2 border-yellow-500/50 ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} text-yellow-500 ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                5. IMPORTANT DISCLAIMER
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4">
                <p className={`${theme.text.small} text-yellow-400 ${theme.fonts.mono} ${theme.fonts.bold} leading-relaxed mb-3 uppercase`}>
                  NOT FINANCIAL ADVICE
                </p>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
                  TokenGuard provides analytical tools and information for educational purposes only. Our risk scores, analyses, and recommendations are NOT financial, investment, or legal advice. You should conduct your own research and consult with qualified professionals before making any investment decisions.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 p-4">
                <p className={`${theme.text.small} text-red-400 ${theme.fonts.mono} ${theme.fonts.bold} leading-relaxed mb-3 uppercase`}>
                  NO GUARANTEES
                </p>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
                  We do not guarantee the accuracy, completeness, or timeliness of our data. Cryptocurrency markets are highly volatile and risky. You may lose some or all of your investment. USE OUR SERVICE AT YOUR OWN RISK.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Subscription and Payment */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                6. SUBSCRIPTION AND PAYMENT
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  6.1 Subscription Plans
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4 mb-3`}>
                  TokenGuard offers three subscription tiers:
                </p>
                <ul className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} space-y-2 ml-8`}>
                  <li>• <span className="text-white">FREE</span> - Basic token analysis with 20 scans per day, honeypot checks, and risk scores</li>
                  <li>• <span className="text-white">PAY-AS-YOU-GO</span> - Micropayment model via x402 protocol (USDC on Base). Pay only for features you use: AI Risk Analyst ($0.10/report), Portfolio Audit ($0.05/token), Enhanced Charts, and ad-free experience</li>
                  <li>• <span className="text-white">PRO ($29/month)</span> - Unlimited access to all features including Smart Alerts (24/7 blockchain monitoring), custom branding, priority support, and always ad-free experience</li>
                </ul>
              </div>

              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  6.2 Billing
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4 mb-2`}>
                  <span className="text-white">Pro Subscriptions:</span> Billed monthly in advance with automatic renewal. All subscription fees are non-refundable except as required by law.
                </p>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4`}>
                  <span className="text-white">Pay-As-You-Go:</span> Charged per transaction via x402 protocol using USDC on Base blockchain. No recurring charges. Credits are non-refundable once purchased.
                </p>
              </div>

              <div>
                <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-2 uppercase`}>
                  6.3 Cancellation and Refunds
                </h3>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4 mb-2`}>
                  <span className="text-white">Pro Subscriptions:</span> You may cancel at any time. Access to Pro features continues until the end of your billing period. We offer a 30-day money-back guarantee for new Pro subscriptions.
                </p>
                <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed ml-4`}>
                  <span className="text-white">Pay-As-You-Go:</span> No cancellation needed. Simply stop using paid features. Unused credits do not expire but are non-refundable.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Intellectual Property */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                7. INTELLECTUAL PROPERTY
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              All content, features, and functionality of TokenGuard, including but not limited to text, graphics, logos, algorithms, and software, are owned by TokenGuard and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute our content without explicit permission.
            </p>
          </section>

          {/* Section 8: Limitation of Liability */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                8. LIMITATION OF LIABILITY
              </h2>
            </div>

            <div className="space-y-4">
              <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed uppercase ${theme.fonts.bold}`}>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>

              <ul className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} space-y-2 ml-4`}>
                <li>• TokenGuard is provided "AS IS" without warranties of any kind</li>
                <li>• We are not liable for any direct, indirect, incidental, or consequential damages</li>
                <li>• We are not responsible for investment losses or financial decisions based on our data</li>
                <li>• Our total liability shall not exceed the amount you paid for the Service in the past 12 months</li>
                <li>• We are not liable for third-party actions, data breaches, or service interruptions</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Indemnification */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                9. INDEMNIFICATION
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              You agree to indemnify and hold harmless TokenGuard, its officers, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          {/* Section 10: Termination */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                10. TERMINATION
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              We reserve the right to suspend or terminate your account at any time for violations of these Terms, fraudulent activity, or any reason at our sole discretion. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          {/* Section 11: Changes to Terms */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                11. CHANGES TO TERMS
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              We may modify these Terms at any time. Material changes will be notified via email or platform notification. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          {/* Section 12: Governing Law */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                12. GOVERNING LAW
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed`}>
              These Terms are governed by and construed in accordance with the laws of the Republic of Lithuania, without regard to its conflict of law principles. Any disputes shall be resolved in the courts of the Republic of Lithuania.
            </p>
          </section>

          {/* Section 13: Contact */}
          <section className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-white" />
              <h2 className={`${theme.text.large} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} ${theme.fonts.tracking} uppercase`}>
                13. CONTACT INFORMATION
              </h2>
            </div>

            <p className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} leading-relaxed mb-4`}>
              For questions about these Terms of Service, please contact us:
            </p>

            <div className={`${theme.text.small} ${theme.text.secondary} ${theme.fonts.mono} space-y-2 ml-4`}>
              <p>
                <span className={theme.text.primary}>Email:</span> nayanjoshymaniyathjoshy@gmail.com
              </p>
              <p>
                <span className={theme.text.primary}>Support:</span> nayanjoshymaniyathjoshy@gmail.com
              </p>
            </div>
          </section>

          {/* Related Links */}
          <div className={`border ${theme.borders.default} ${theme.backgrounds.card} p-6`}>
            <h3 className={`${theme.text.base} ${theme.fonts.bold} ${theme.text.primary} ${theme.fonts.mono} mb-4 uppercase`}>
              RELATED DOCUMENTS
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/privacy" 
                className={`inline-flex items-center gap-2 px-4 py-2 border ${theme.borders.default} ${theme.text.primary} hover:bg-white hover:text-black transition-all ${theme.fonts.mono} text-xs uppercase`}
              >
                PRIVACY POLICY
              </Link>
              <Link 
                href="/privacy-settings" 
                className={`inline-flex items-center gap-2 px-4 py-2 border ${theme.borders.default} ${theme.text.primary} hover:bg-white hover:text-black transition-all ${theme.fonts.mono} text-xs uppercase`}
              >
                PRIVACY SETTINGS
              </Link>
              <Link 
                href="/profile" 
                className={`inline-flex items-center gap-2 px-4 py-2 border ${theme.borders.default} ${theme.text.primary} hover:bg-white hover:text-black transition-all ${theme.fonts.mono} text-xs uppercase`}
              >
                YOUR ACCOUNT
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stars-bg {
          background-image: 
            radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 33% 80%, white, transparent),
            radial-gradient(1px 1px at 15% 60%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%, 180% 180%, 250% 250%, 220% 220%, 190% 190%, 240% 240%, 210% 210%, 230% 230%;
          background-position: 0% 0%, 40% 40%, 60% 60%, 20% 20%, 80% 80%, 30% 30%, 70% 70%, 50% 50%;
          opacity: 0.3;
        }
      `}</style>
    </div>
  )
}
