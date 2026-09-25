import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from './landing/LandingNavbar';
import LandingFooter from './landing/LandingFooter';
import MithuHero from './landing/MithuHero';
import {
  AudienceSection,
  WhatSection,
  DemoSection,
  BenefitsSection,
  HowItWorksSection,
  ActivitiesSection,
} from './landing/LandingSections';
import './landing/landing.css';

// Public landing page (what visitors see before logging in).
const Homepage = () => {
  const { hash } = useLocation();

  // Coming from another page with a link like /#demo: scroll once the sections exist.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView();
  }, [hash]);

  return (
    <div className="landing min-h-screen">
      <title>AI Tutor | AI-Powered Early Learning for Kids, Schools and Parents</title>
      <LandingNavbar />
      <main>
        <MithuHero />
        <AudienceSection />
        <WhatSection />
        <DemoSection />
        <BenefitsSection />
        <HowItWorksSection />
        <ActivitiesSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Homepage;
