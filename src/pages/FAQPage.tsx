import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const faqs: FAQItem[] = [
    {
      question: "What is Demo Manager?",
      answer: "Demo Manager by Basic Wavez is a platform that allows music producers and artists to upload, share, and collect feedback on their music demos. It helps streamline the feedback process and track the progress of your tracks.",
      category: "general"
    },
    {
      question: "Is my music protected when I upload it?",
      answer: "Yes, we take the security of your intellectual property seriously. Your uploads are only accessible to those you specifically share them with through our sharing system. We also implement secure storage practices to protect your content.",
      category: "security"
    },
    {
      question: "What audio formats are supported?",
      answer: "Demo Manager supports common audio formats including MP3, WAV, and AAC. We recommend uploading high-quality audio files for the best experience.",
      category: "technical"
    },
    {
      question: "How do I share my demo with collaborators?",
      answer: "After uploading your track, you can generate a unique sharing link from the track page. This link can be sent to anyone, and they'll be able to listen and provide feedback without needing an account.",
      category: "usage"
    },
    {
      question: "Can I delete my tracks after uploading?",
      answer: "Absolutely. You maintain full control over your content. You can delete any track from your account at any time through the track settings.",
      category: "usage"
    },
    {
      question: "How do I provide feedback on someone's track?",
      answer: "When viewing a shared track, you'll see a feedback form below the player. You can enter your comments and submit them. The track owner will receive a notification of your feedback.",
      category: "usage"
    },
    {
      question: "Can I update my demo with new versions?",
      answer: "Yes! We encourage iterative improvement. You can upload new versions of your tracks while keeping the original and all received feedback intact for comparison.",
      category: "usage"
    },
    {
      question: "How does the versioning system work?",
      answer: "Each track can have multiple versions. When you upload a new version, it's added to the track's version history. Listeners can switch between versions to hear how the track has evolved and provide feedback on specific versions.",
      category: "technical"
    },
  ];
  
  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-4 text-white">Frequently Asked Questions</h1>
        <p className="text-gray-400 mb-8">
          Find answers to common questions about Demo Manager. If you can't find what you're looking for, 
          please reach out to us through our <a href="/contact" className="text-wip-pink hover:underline">contact page</a>.
        </p>
        
        <div className="mb-8">
          <Input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {filteredFAQs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {filteredFAQs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-gray-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No results found for "{searchQuery}".</p>
            <p className="text-gray-400 mt-2">Try a different search term or <a href="/contact" className="text-wip-pink hover:underline">contact us</a> for help.</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQPage;
