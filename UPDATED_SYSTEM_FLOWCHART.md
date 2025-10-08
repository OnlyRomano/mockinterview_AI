# Updated System Flowchart - Mock Interview Application

## Complete System Flow

The system flowchart is available in the `system_flowchart.mmd` file. You can view it using any Mermaid-compatible viewer or render it directly in your IDE.

**To view the flowchart:**
- Copy the contents of `system_flowchart.mmd` 
- Paste into any Mermaid editor (like mermaid.live)
- Or use a Mermaid extension in your IDE

## Flowchart Overview

## Key Improvements Made:

### 1. **Enhanced Authentication Flow**
- Added MD5 password hashing for security
- Included Iron Session management for secure session handling
- Proper session validation with middleware
- Error handling for invalid credentials

### 2. **Complete Interview Creation Process**
- Added interview form submission through Agent component
- **Interview Questions Databank Integration**: Queries comprehensive question database with 600+ questions across multiple tech stacks and levels
- **Smart Question Filtering**: Filters databank by level (entry/junior/mid/senior), tech stack, and type (technical/behavioral/mixed)
- **AI-Enhanced Generation**: Google AI SDK (Gemini 2.0) uses databank questions as reference to generate unique, contextual questions
- Database saving with proper error handling

### 3. **Detailed Interview Execution**
- Face detection initialization with Face-API.js models
- VAPI connection setup for voice AI interview
- Real-time interview process with feedback loop
- Transcript collection and analysis
- Face detection data aggregation and analysis

### 4. **Comprehensive Feedback System**
- AI-powered feedback generation using Google AI SDK (Gemini 2.0)
- Face detection data integration (confidence, expressions, gaze tracking)
- Score calculation and assessment across multiple categories
- Database persistence with proper error handling

### 5. **Enhanced Error Handling**
- API failure handling for question generation
- Feedback generation error handling
- User-friendly error messages throughout the flow

### 6. **External Service Integration**
- Google AI SDK (Gemini 2.0) for question generation and feedback analysis
- VAPI for voice AI interview with workflow support
- Face-API.js for real-time face detection and analysis
- MongoDB for data persistence with proper models

### 7. **User Journey Completion**
- Feedback display with detailed breakdown and scores
- Options to retake interview or return to dashboard
- Complete user experience flow with proper navigation

## System Components:

### **Frontend Components:**
- **Authform** (Authentication with form validation)
- **InterviewCard** (Interview display with feedback status)
- **DisplayTechIcons** (Tech stack visualization)
- **Agent** (AI Interview Interface with VAPI integration)
- **FaceDetection** (Real-time face analysis with Face-API.js)

### **Backend Services:**
- **Authentication Actions** (Sign-in/Sign-up with MD5 hashing)
- **General Actions** (Interview & Feedback Management)
- **API Routes** (/api/vapi/generate for question generation)
- **Database Models** (User, Interview, Feedback with proper schemas)

### **External Integrations:**
- **Google AI SDK** (Gemini 2.0 for question generation & feedback analysis)
- **VAPI** (Voice AI Interview with workflow support)
- **Face-API.js** (Face detection, expression analysis, and gaze tracking)
- **MongoDB** (Data persistence with Mongoose models)
- **Interview Questions Databank** (600+ curated questions across JavaScript, React, Node.js, Python, SQL, CSS, HTML, Git, TypeScript)

### **Key Features:**
- **Real-time Face Detection**: Tracks expressions, confidence, gaze direction, and multiple people detection
- **Voice AI Interview**: Natural conversation flow with VAPI integration
- **Comprehensive Feedback**: AI-powered analysis with face detection insights
- **Smart Question Generation**: AI-enhanced question creation using curated databank as reference
- **Multi-Tech Stack Support**: Questions for JavaScript, React, Node.js, Python, SQL, CSS, HTML, Git, TypeScript
- **Level-Based Filtering**: Entry, Junior, Mid, and Senior level questions
- **Question Type Variety**: Technical, Behavioral, and Mixed question types
- **Secure Authentication**: Iron sessions with MD5 password hashing
- **Responsive Design**: Modern UI with proper error handling

This updated flowchart provides a complete and accurate representation of your mock interview application's system flow, including all major processes, decision points, integrations, and the sophisticated face detection and AI feedback systems.
