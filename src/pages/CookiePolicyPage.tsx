
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">Cookie Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 mb-6">
            Last updated: May 16, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              This Cookie Policy explains how Demo Manager by Basic Wavez ("we," "our," or "us") uses cookies and similar technologies to recognize you when you visit our website and application ("Service"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
            </p>
            <p className="mb-4">
              Cookies set by the website owner (in this case, Basic Wavez) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics).
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Why Do We Use Cookies?</h2>
            <p className="mb-4">
              We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Service to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our Service. Third parties serve cookies through our Service for analytics and other purposes.
            </p>
            <p className="mb-4">The specific types of cookies served through our Service and the purposes they perform include:</p>
            
            <h3 className="text-lg font-medium mb-3">3.1 Essential Cookies</h3>
            <p className="mb-4">
              These cookies are strictly necessary to provide you with services available through our Service and to use some of its features, such as access to secure areas. Because these cookies are strictly necessary to deliver the Service, you cannot refuse them without impacting how our Service functions.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Authentication cookies: Used to identify you when you log in to our Service</li>
              <li className="mb-2">Security cookies: Used to enable and support security features</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-3">3.2 Performance and Functionality Cookies</h3>
            <p className="mb-4">
              These cookies are used to enhance the performance and functionality of our Service but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Preference cookies: Used to remember information that changes the way the Service behaves or looks</li>
              <li className="mb-2">User interface customization cookies: Used to remember your preferences and various settings</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-3">3.3 Analytics and Customization Cookies</h3>
            <p className="mb-4">
              These cookies collect information that is used either in aggregate form to help us understand how our Service is being used or how effective our marketing campaigns are, or to help us customize our Service for you.
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Analytics cookies: Used to collect information about how you use the Service, which pages you visited and which links you clicked on</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. How Can You Control Cookies?</h2>
            <p className="mb-4">
              You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our Service though your access to some functionality and areas may be restricted.
            </p>
            <p className="mb-4">
              The specific method for controlling cookies varies by browser. You can find instructions for managing cookies in the help section of most browsers:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">Chrome: chrome://settings/content/cookies</li>
              <li className="mb-2">Firefox: about:preferences#privacy</li>
              <li className="mb-2">Safari: preferences, then Privacy tab</li>
              <li className="mb-2">Internet Explorer: Tools {'>'}  Internet Options {'>'}  Privacy tab</li>
              <li className="mb-2">Edge: Settings {'>'}  Cookies and site permissions</li>
            </ul>
            <p className="mb-4">
              In addition, most advertising networks offer you a way to opt out of targeted advertising. You can find more information at:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2"><a href="http://www.aboutads.info/choices/" className="text-wip-pink underline">http://www.aboutads.info/choices/</a></li>
              <li className="mb-2"><a href="http://www.youronlinechoices.com/" className="text-wip-pink underline">http://www.youronlinechoices.com/</a></li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Changes to This Cookie Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal, or regulatory reasons. Please therefore revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
            </p>
            <p className="mb-4">
              The date at the top of this Cookie Policy indicates when it was last updated.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or other technologies, please contact us at support@basicwavez.com.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CookiePolicyPage;

