
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-8 text-white">About Basic Wavez</h1>
        
        <div className="prose prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4">
              At Basic Wavez, we're passionate about music and helping artists bring their vision to life. 
              Our Demo Manager platform was created to bridge the gap between creative inspiration and 
              professional feedback, making it easier for producers, artists, and musicians to collaborate 
              and refine their work.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Who We Are</h2>
            <p className="mb-4">
              Founded by a team of music producers and technology enthusiasts, Basic Wavez 
              combines industry knowledge with innovative tech solutions. We understand the challenges 
              of the creative process and have designed our platform to address the specific needs of 
              today's music creators.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                <strong>Creativity First</strong> - We believe in putting creative expression at the forefront 
                of everything we do.
              </li>
              <li>
                <strong>Community Support</strong> - Building a supportive network where artists can grow 
                and learn from each other.
              </li>
              <li>
                <strong>Technical Excellence</strong> - Delivering reliable, intuitive tools that enhance 
                rather than complicate the creative workflow.
              </li>
              <li>
                <strong>Accessibility</strong> - Making music production and feedback accessible to creators 
                at all levels.
              </li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Our Story</h2>
            <p className="mb-4">
              Basic Wavez began as a solution to a common problem faced by our founder during collaborative 
              music projects: efficiently sharing demo versions and collecting specific, timely feedback. 
              What started as an internal tool for a small production team has grown into a comprehensive 
              platform serving music creators worldwide.
            </p>
            <p className="mb-4">
              Today, we're proud to offer a suite of tools designed specifically for the music creation 
              process, helping artists turn their rough demos into polished tracks.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Join Us</h2>
            <p className="mb-4">
              Whether you're a solo producer working from your bedroom or part of a professional studio team, 
              we invite you to experience how Demo Manager can transform your workflow. Join our growing community 
              of creators and take your music to the next level.
            </p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
