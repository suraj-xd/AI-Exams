import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiFileText, 
  FiImage, 
  FiMic, 
  FiZap, 
  FiTarget, 
  FiStar, 
  FiGithub, 
  FiTwitter, 
  FiLinkedin,
  FiPlay,
  FiBook,
  FiCheckCircle,
  FiTrendingUp,
  FiCommand,
  FiGlobe,
  FiCpu,
  FiSearch,
  FiShield,
  FiMonitor
} from 'react-icons/fi';
import { IoColorFillOutline } from 'react-icons/io5';
import { SiTruenas } from 'react-icons/si';
import { TiDocumentText } from 'react-icons/ti';
import { MdOutlineFeedback, MdTranslate } from 'react-icons/md';
import Image from 'next/image';

export default function About() {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <FiCpu className="w-8 h-8" />,
      title: "RAG-Powered Question Generation",
      description: "Advanced Retrieval-Augmented Generation using Google's Gemini AI to create contextually relevant questions from your uploaded documents, images, and prompts.",
      tech: "Google Gemini 2.0 Flash, Vector Embeddings"
    },
    {
      icon: <FiFileText className="w-8 h-8" />,
      title: "Multimodal Content Processing",
      description: "Upload PDFs, images, text files, and more. Our AI extracts educational content from any format and generates comprehensive assessments.",
      tech: "PDF Parser, OCR, Document Understanding"
    },
    {
      icon: <FiSearch className="w-8 h-8" />,
      title: "Context-Aware Intelligence",
      description: "Smart content analysis that understands context, difficulty levels, and learning objectives to create perfectly tailored educational content.",
      tech: "Semantic Analysis, Content Structuring"
    },
    {
      icon: <FiShield className="w-8 h-8" />,
      title: "Advanced Answer Analysis",
      description: "AI-powered originality detection and authenticity checks. Our summary layer reverse engineers submitted answers to ensure academic integrity.",
      tech: "Pattern Recognition, Plagiarism Detection"
    },
    {
      icon: <FiMonitor className="w-8 h-8" />,
      title: "Gamified Learning Experience",
      description: "Arcade mode with performance-based leveling, achievement tracking, and interactive challenges that make learning engaging and fun.",
      tech: "Progress Analytics, Gamification Engine"
    },
    {
      icon: <FiMic className="w-8 h-8" />,
      title: "Voice Commands & Navigation",
      description: "Hands-free interaction with Shift+A voice commands and lightning-fast navigation with Cmd+K shortcuts for seamless user experience.",
      tech: "Speech Recognition, Hotkey Integration"
    }
  ];

  const questionTypes = [
    { icon: <IoColorFillOutline />, name: "Multiple Choice Questions", count: "Up to 20" },
    { icon: <IoColorFillOutline />, name: "Fill in the Blanks", count: "Up to 20" },
    { icon: <SiTruenas />, name: "True/False Questions", count: "Up to 20" },
    { icon: <TiDocumentText />, name: "Short Answer Questions", count: "Up to 10" },
    { icon: <MdOutlineFeedback />, name: "Long Answer Questions", count: "Up to 5" }
  ];

  const techStack = [
    "Next.js 14", "TypeScript", "Google Gemini AI", "Tailwind CSS", 
    "Framer Motion", "Zustand", "Axios", "React Markdown"
  ];

  return (
    <>
      <Head>
        <title>About - AI Exams | Intelligent Educational Assessment Platform</title>
        <meta name="description" content="Learn about AI Exams - the next-generation educational platform powered by advanced AI, RAG technology, and intelligent content processing." />
        <meta property="og:title" content="About AI Exams - Where Testing Meets Intelligence" />
        <meta property="og:description" content="Discover how AI Exams revolutionizes education with RAG-powered question generation, multimodal content processing, and gamified learning experiences." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#13151A] via-[#1F2329] to-[#13151A] text-white">
        {/* Header */}
        <motion.div 
          className="container mx-auto px-6 py-8"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
              AI Exams
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Where Testing Meets Intelligence. The next-generation educational platform that revolutionizes 
              how we create, take, and analyze assessments using cutting-edge AI technology.
            </p>
            
            {/* Demo Video */}
            <motion.div 
              className="max-w-4xl mx-auto mb-12"
              variants={fadeInUp}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gray-800">
                <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <Link 
                    href="https://drive.google.com/file/d/1xv40JRgDIw9uiRCjyKHJ9W2u8DMSp7FQ/view?usp=sharing"
                    target="_blank"
                    className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors text-lg font-semibold"
                  >
                    <FiPlay className="w-6 h-6" />
                    Watch Demo Video
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="flex justify-center gap-4 flex-wrap"
              variants={fadeInUp}
            >
              <Link 
                href="/" 
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FiZap className="w-5 h-5" />
                Try AI Exams
              </Link>
              <Link 
                href="https://github.com/suraj-xd/AI-Exams"
                target="_blank"
                className="px-8 py-3 border border-gray-600 hover:border-gray-500 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <FiGithub className="w-5 h-5" />
                View on GitHub
              </Link>
            </motion.div>
          </motion.div>

          {/* Core Features */}
          <motion.section className="mb-20" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-center mb-4">Revolutionary Features</h2>
            <p className="text-xl text-gray-400 text-center mb-12 max-w-3xl mx-auto">
              Powered by advanced AI and designed for the future of education
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1F2329] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all hover:scale-105"
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                >
                  <div className="text-blue-400 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">{feature.description}</p>
                  <div className="text-sm text-blue-300 font-medium">{feature.tech}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Question Types */}
          <motion.section className="mb-20" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-center mb-4">Question Generation Capabilities</h2>
            <p className="text-xl text-gray-400 text-center mb-12">
              Generate comprehensive assessments with multiple question formats
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {questionTypes.map((type, index) => (
                <motion.div
                  key={index}
                  className="bg-[#1F2329] rounded-lg p-6 text-center border border-gray-800 hover:border-blue-500 transition-all"
                  variants={fadeInUp}
                >
                  <div className="text-3xl text-blue-400 mb-3 flex justify-center">{type.icon}</div>
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  <p className="text-sm text-gray-400">{type.count}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Key Highlights */}
          <motion.section className="mb-20" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-center mb-12">What Makes Us Special</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <FiCpu className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">RAG-Powered Intelligence</h3>
                    <p className="text-gray-400">Our Retrieval-Augmented Generation system analyzes your documents, images, and context to create highly relevant educational content that adapts to your specific needs.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <FiShield className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Academic Integrity Protection</h3>
                    <p className="text-gray-400">Advanced summary layer technology reverse engineers submitted answers to detect patterns, ensuring authenticity and preventing academic misconduct.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <FiTrendingUp className="w-6 h-6 text-purple-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
                    <p className="text-gray-400">Comprehensive scoring, feedback generation, and progress tracking with performance-based leveling system that motivates continuous learning.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <FiMic className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Voice & Keyboard Shortcuts</h3>
                    <p className="text-gray-400">Seamless interaction with Shift+A voice commands and Cmd+K fast navigation for an efficient, hands-free learning experience.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <MdTranslate className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
                    <p className="text-gray-400">One-touch translation capabilities make education accessible across language barriers, supporting global learning initiatives.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <FiMonitor className="w-6 h-6 text-pink-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Gamified Learning</h3>
                    <p className="text-gray-400">Arcade mode transforms past exam content into engaging challenges with achievement systems and progressive difficulty scaling.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Technology Stack */}
          <motion.section className="mb-20" variants={fadeInUp}>
            <h2 className="text-4xl font-bold text-center mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-gray-400 text-center mb-12">
              Leveraging cutting-edge tools and frameworks for optimal performance
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              {techStack.map((tech, index) => (
                <motion.span
                  key={index}
                  className="px-4 py-2 bg-[#1F2329] border border-gray-700 rounded-full text-sm font-medium hover:border-blue-500 transition-colors"
                  variants={fadeInUp}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.section>

          {/* Project Info */}
          <motion.section className="mb-20" variants={fadeInUp}>
            <div className="bg-[#1F2329] rounded-2xl p-8 border border-gray-800">
              <h2 className="text-3xl font-bold text-center mb-6">100xEngineers Buildathon Project</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiTarget className="w-6 h-6 text-blue-400" />
                    Project Vision
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    AI Exams was conceived to revolutionize educational assessment by combining 
                    artificial intelligence with user-centric design. Our goal is to make 
                    testing more intelligent, engaging, and accessible for educators and learners worldwide.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiStar className="w-6 h-6 text-yellow-400" />
                    Design Philosophy
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Every visual element was crafted with attention to detail. All assets and images 
                    were generated using ChatGPT and carefully designed in Figma to create a cohesive, 
                    modern, and intuitive user experience.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Connect & Contribute */}
          <motion.section className="text-center" variants={fadeInUp}>
            <h2 className="text-4xl font-bold mb-6">Connect & Contribute</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join our community and help shape the future of AI-powered education
            </p>
            
            <div className="flex justify-center gap-6 mb-8">
              <Link 
                href="https://github.com/suraj-xd/AI-Exams"
                target="_blank"
                className="flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiGithub className="w-5 h-5" />
                GitHub Repository
              </Link>
              <Link 
                href="https://twitter.com/notsurajgaud"
                target="_blank"
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <FiTwitter className="w-5 h-5" />
                Follow Updates
              </Link>
              <Link 
                href="https://linkedin.com/in/gaudsuraj"
                target="_blank"
                className="flex items-center gap-3 px-6 py-3 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors"
              >
                <FiLinkedin className="w-5 h-5" />
                Connect
              </Link>
            </div>
            
            <div className="text-gray-400">
              <p className="mb-2">Built with ❤️ by the AI Exams Team</p>
              <p className="text-sm">© 2024 AI Exams. Assess better. Learn smarter.</p>
            </div>
          </motion.section>
        </motion.div>
      </div>
    </>
  );
}