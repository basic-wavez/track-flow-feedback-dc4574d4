
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            Last updated: May 16, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Demo Manager by Basic Wavez ("we," "our," or "us") values your privacy. This Privacy Policy explains what information we collect, how we use it, and what choices you have regarding your information when you use our service.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-3">2.1 Personal Information</h3>
            <p className="mb-4">
              When you register for an account, we collect personal information such as:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Email address</li>
              <li className="mb-2">Name (optional)</li>
              <li className="mb-2">Profile information (optional)</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-3">2.2 Audio Content</h3>
            <p className="mb-4">
              When you upload audio files to our service, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">The audio files themselves</li>
              <li className="mb-2">Metadata associated with the files</li>
              <li className="mb-2">Track names, descriptions, and annotations you provide</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-3">2.3 Usage Data</h3>
            <p className="mb-4">
              We collect usage data when you interact with our service, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Track play counts</li>
              <li className="mb-2">Download statistics</li>
              <li className="mb-2">Feedback submissions</li>
              <li className="mb-2">Log data (IP address, browser type, pages visited, time spent)</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Provide, maintain, and improve our service</li>
              <li className="mb-2">Process and complete transactions</li>
              <li className="mb-2">Send administrative information, such as updates or security alerts</li>
              <li className="mb-2">Track play counts and download statistics for your audio files</li>
              <li className="mb-2">Respond to your comments, questions, and requests</li>
              <li className="mb-2">Develop new features and services</li>
              <li className="mb-2">Monitor and analyze trends, usage, and activities in connection with our service</li>
              <li className="mb-2">Detect, investigate, and prevent security incidents</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>
            <p className="mb-4">
              Your audio files and account data are stored securely in our cloud storage system. We use industry-standard encryption for data in transit and at rest.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Sharing Your Information</h2>
            <p className="mb-4">We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">With service providers who perform services on our behalf</li>
              <li className="mb-2">To comply with legal obligations</li>
              <li className="mb-2">To protect our rights and the safety of our users</li>
              <li className="mb-2">In connection with a business transfer, such as a merger or acquisition</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4">
              Depending on your location, you may have certain rights regarding your personal information, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">The right to access your personal information</li>
              <li className="mb-2">The right to correct inaccurate information</li>
              <li className="mb-2">The right to delete your information</li>
              <li className="mb-2">The right to restrict or object to processing</li>
              <li className="mb-2">The right to data portability</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, please contact us at privacy@basicwavez.com.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
            </p>
            <p className="mb-4">
              You can delete your account at any time. Upon deletion, your personal information will be removed from our active databases, though some information may remain in our backups for a limited time.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Children's Privacy</h2>
            <p className="mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we learn we have collected personal information from a child under 13, we will delete that information promptly.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            <p className="mb-4">
              You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, please contact us at privacy@basicwavez.com.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
