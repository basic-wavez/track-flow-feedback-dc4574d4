
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            Last updated: May 16, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to Demo Manager by Basic Wavez ("we," "our," or "us"). By accessing or using our service, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Definitions</h2>
            <p className="mb-4">"Service" refers to the Demo Manager application provided by Basic Wavez.</p>
            <p className="mb-4">"User" refers to any individual who accesses or uses the Service.</p>
            <p className="mb-4">"Content" refers to audio files, feedback, comments, and other material that may be uploaded, shared or created through the Service.</p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Obligations and Responsibilities</h2>
            <p className="mb-4">
              You are responsible for safeguarding your account and for all activities that occur under your account. You agree not to share your login credentials with any third party.
            </p>
            <p className="mb-4">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">In any way that violates any applicable law or regulation.</li>
              <li className="mb-2">To upload or share any content that infringes upon the intellectual property rights of others.</li>
              <li className="mb-2">To distribute malware, viruses, or any other malicious code.</li>
              <li className="mb-2">To attempt to gain unauthorized access to any part of the Service.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Intellectual Property Rights</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Basic Wavez and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              You retain all rights to the Content you upload to the Service. By uploading Content to the Service, you grant us a non-exclusive, worldwide, royalty-free license to use, reproduce, and distribute your Content solely for the purpose of providing and improving the Service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall Basic Wavez, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Your access to or use of or inability to access or use the Service.</li>
              <li className="mb-2">Any unauthorized access to or use of our servers and/or any personal information stored therein.</li>
              <li className="mb-2">Any interruption or cessation of transmission to or from the Service.</li>
              <li className="mb-2">Any bugs, viruses, or the like that may be transmitted to or through the Service.</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p className="mb-4">
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law provisions.
            </p>
            <p className="mb-4">
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p className="mb-4">
              By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at support@basicwavez.com.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
