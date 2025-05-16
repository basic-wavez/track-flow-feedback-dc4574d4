
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Bug } from "lucide-react";
import { toast } from "@/hooks/use-toast";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const bugReportSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bugType: z.string({
    required_error: "Please select a bug type.",
  }),
  description: z.string().min(20, {
    message: "Bug description must be at least 20 characters.",
  }),
  stepsToReproduce: z.string().min(10, {
    message: "Please provide steps to reproduce the issue.",
  }),
  browserInfo: z.string().optional(),
});

const BugReportPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof bugReportSchema>>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      name: "",
      email: "",
      bugType: "",
      description: "",
      stepsToReproduce: "",
      browserInfo: "",
    },
  });

  function onSubmit(values: z.infer<typeof bugReportSchema>) {
    setIsSubmitting(true);
    
    // Get browser info if not provided
    if (!values.browserInfo) {
      values.browserInfo = `${navigator.userAgent}`;
    }
    
    // Simulate API call
    setTimeout(() => {
      console.log(values);
      toast({
        title: "Bug report submitted!",
        description: "Thank you for helping us improve Demo Manager.",
      });
      form.reset();
      setIsSubmitting(false);
    }, 1500);
  }

  return (
    <div className="min-h-screen bg-wip-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Bug className="h-6 w-6 text-wip-pink" />
            <h1 className="text-3xl font-bold text-white">Report a Bug</h1>
          </div>
          
          <p className="text-gray-400">
            Found an issue with Demo Manager? Help us improve by submitting a bug report. We appreciate your feedback!
          </p>
        </div>
        
        <div className="supabase-card p-6 mb-8">
          <h2 className="text-xl font-medium mb-4">Before Submitting</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Check if your issue has already been reported in our <a href="/faq" className="text-wip-pink hover:underline">FAQ</a>.</li>
            <li>Try clearing your browser cache and cookies, then test again.</li>
            <li>Include as much detail as possible in your report to help us reproduce and fix the issue.</li>
            <li>Screenshots or screen recordings are extremely helpful, if possible.</li>
          </ul>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="bugType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bug Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bug category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="audio_playback">Audio Playback</SelectItem>
                      <SelectItem value="upload">File Upload</SelectItem>
                      <SelectItem value="feedback">Feedback System</SelectItem>
                      <SelectItem value="ui">User Interface</SelectItem>
                      <SelectItem value="account">Account/Login</SelectItem>
                      <SelectItem value="performance">Performance Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bug Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe the issue in detail..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    What happened? What did you expect to happen?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="stepsToReproduce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps to Reproduce</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="1. Go to...
2. Click on...
3. Observe..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    List the exact steps needed to reproduce this issue
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="browserInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Browser & System Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Browser name and version, operating system, etc. (Leave blank to auto-detect)" 
                      className="min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This helps us identify if the issue is browser-specific
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Bug Report"}
            </Button>
          </form>
        </Form>
      </main>
      
      <Footer />
    </div>
  );
};

export default BugReportPage;
