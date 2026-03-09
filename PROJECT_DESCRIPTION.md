# Project Description

The Mock Interview System is designed to help job seekers practice technical and behavioral interviews in a realistic setting. It provides voice-based AI interviews, real-time conversation transcripts, and face detection during sessions, with detailed feedback after each interview. The system uses an AI voice agent to conduct interviews and computer vision for face detection, and combines AI scoring with face-detection metrics to produce category scores and written feedback. This allows users to practice answering interview questions aloud, maintain appropriate presence (e.g., eye contact and engagement), and receive structured feedback on both content and delivery. The application supports repeated practice with retakes, reduces anxiety before real interviews, and helps users improve their interview skills and confidence.

The most important components of the software are the interview generation module, the interview session module, and the feedback module. The interview generation module creates tailored interview questions by role, experience level, tech stack, and type (e.g., behavioral vs. technical), and saves the interview for the user. The interview session module runs the voice-based interview, delivers questions in order, captures the user’s answers and a live transcript, and runs face detection in the background to measure presence and engagement. The feedback module computes category scores (including a face-detection score), generates strengths and areas for improvement using AI, and presents an overall assessment and per-question insights.

In addition to these core components, the system includes authentication (sign-up, sign-in, email verification), session management, and a user interface for the home page, interview creation, live session, and feedback screens. The transcript and speaker highlighting (e.g., green border when speaking) give clear visual feedback during the session. Face detection data is aggregated and used in feedback only, not displayed in real time. Integration with the voice platform and database ensures that interviews, transcripts, and feedback are stored and linked to the user. Together, these components provide a complete practice-to-feedback loop, helping users improve their interview performance and confidence.

## Project Structure

The following figures illustrate the structure of the Mock Interview System, highlighting its overall design, interface layout, key functional modules, and supporting features. Each image is accompanied by detailed descriptions to provide readers, users, and evaluators with a clear understanding of how the system operates in practice. The figures showcase how the web application works with the AI voice agent and the user’s camera to run voice-based interviews and capture face detection data in real time. They also demonstrate the flow and accessibility of the main features, including sign-in and sign-up, email verification, the home page, interview creation, the live interview session with transcript and face detection, and the feedback screen with category scores and written comments. Additionally, the images highlight minor yet important functionalities, such as speaker highlighting during the session, interview role and tech stack display, retake options, and settings or navigation, which contribute to the overall user experience.

## Project Capabilities and Limitations

The following are the capabilities of the project:

1. The application includes a user manual that explains system functions, features, and essential usage for sign-in, sign-up, home, interview creation, interview session, and feedback;
2. Users can conduct voice-based mock interviews with an AI agent and receive real-time transcript feedback during the session;
3. The system generates tailored interview questions by role, experience level, tech stack, and type (e.g., behavioral or technical) to support relevant practice;
4. Users receive structured feedback after each interview, including category scores, strengths, areas for improvement, and an overall assessment;
5. The application uses face detection during the session to measure presence and engagement and includes a face-detection score in the feedback;
6. Users can start and end the interview using simple controls (Call and End) and see who is speaking via transcript and speaker highlighting;
7. The system supports retakes (within a configurable limit) so users can practice the same interview again with new questions;
8. Speaker highlighting (e.g., green border) and live transcript provide clear visual feedback during the interview;
9. The application integrates authentication, interview flow, and feedback into a single web-based, user-friendly interface; and,
10. The system works with the user’s browser, microphone, and camera and connects to a voice platform and database for portable, flexible use.

The following are the limitations of the project:

1. The accuracy of face detection and engagement metrics may decrease in poor lighting or with low-quality or unstable camera feed;
2. Interview and feedback quality depend on stable internet connectivity for the voice agent and AI scoring services;
3. System performance may be affected by background noise or unclear speech, which can reduce transcript accuracy and feedback relevance;
4. The number of retakes per interview is limited (e.g., to a maximum of two), after which the user must create a new interview to practice again.
