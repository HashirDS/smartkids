import React from 'react';
import LandingNavbar from './landing/LandingNavbar';
import LandingFooter from './landing/LandingFooter';
import MithuHero from './landing/MithuHero';
import {
  AudienceSection,
  WhatSection,
  BenefitsSection,
  HowItWorksSection,
  ActivitiesSection,
} from './landing/LandingSections';
import './landing/landing.css';

// Public landing page (what visitors see before logging in).
const Homepage = () => {
  return (
    <div className="landing min-h-screen">
      <title>AI Tutor | Learning that feels like cartoon time</title>
      <LandingNavbar />
      <main>
        <MithuHero />
        <AudienceSection />
        <WhatSection />
        <BenefitsSection />
        <HowItWorksSection />
        <ActivitiesSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Homepage;
