import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from './LegalLayout';

const TermsOfService = () => (
  <LegalLayout
    title="Terms and Conditions"
    description="The terms for using AI Tutor, the AI-powered early-learning platform for schools, academies and parents."
    intro="These terms apply to everyone who uses AI Tutor, including schools, academies, teachers, parents and the children who learn with it. By creating an account or using the site, you agree to them."
  >
    <Section title="Who can use AI Tutor">
      <p>
        Accounts must be created by an adult: a parent, guardian, teacher or school representative. Children
        may use AI Tutor only with the permission and supervision of that adult, who is responsible for the
        child&apos;s use of the service.
      </p>
    </Section>

    <Section title="Schools, principals and parental consent">
      <List
        items={[
          "A school that adds children to AI Tutor must first get consent from each child's parent or guardian, and keep a record of it. The school is responsible for its students' data and we process it on the school's behalf.",
          "Principals and teachers may only use children's data to teach them and to report progress to their families.",
          "Parents who join with a class code confirm that they are the child's parent or guardian.",
          "Parents can download or delete their child's data at any time from the parent page. Schools can remove students at any time.",
        ]}
      />
    </Section>

    <Section title="Accounts">
      <List
        items={[
          'Give accurate information and keep your password private.',
          'Teacher accounts are reviewed and approved by an administrator before they can be used, because teachers can see student progress.',
          'You are responsible for activity on your account. Tell us straight away if you think someone else has used it.',
        ]}
      />
    </Section>

    <Section title="Acceptable use">
      <p>You agree not to:</p>
      <List
        items={[
          'Try to access accounts, data or parts of the service you are not allowed to.',
          'Probe, scan, overload or disrupt the service, or get around its security or usage limits.',
          'Use AI Tutor to create or share anything harmful, abusive, illegal or unsuitable for children.',
          'Copy, resell or reverse-engineer the service.',
        ]}
      />
    </Section>

    <Section title="AI-generated content">
      <p>
        The 3D teacher, quizzes, poems and assistant use artificial intelligence. AI can sometimes make
        mistakes, so answers are for learning support and are not professional advice. Parents and teachers
        should supervise young learners.
      </p>
    </Section>

    <Section title="Free classroom demo">
      <p>
        Visitors can try the 3D classroom for a few minutes without an account. We may change or end the
        demo at any time.
      </p>
    </Section>

    <Section title="Our content">
      <p>
        AI Tutor, its name, mascot Mithu, design, lessons and software belong to XactGen and Datix AI or our
        licensors. You may use them only to learn and teach through the service.
      </p>
    </Section>

    <Section title="Availability and changes">
      <p>
        We work to keep AI Tutor available and safe, but it is provided &quot;as is&quot; and may sometimes
        be interrupted. We may update features or these terms; the date at the top shows the latest
        version.
      </p>
    </Section>

    <Section title="Ending your account">
      <p>
        You can ask us to close your account at any time. We may suspend or close accounts that break
        these terms or put children or the service at risk.
      </p>
    </Section>

    <Section title="Liability">
      <p>
        To the extent the law allows, we are not liable for indirect or consequential losses arising from
        use of AI Tutor. Nothing in these terms limits rights you have under consumer-protection law in your
        country.
      </p>
    </Section>

    <Section title="Governing law">
      <p>
        These terms are governed by the laws of Pakistan, and the courts of Azad Jammu and Kashmir have
        jurisdiction, unless the law of your country gives you the right to bring a claim where you live.
      </p>
    </Section>

    <Section title="Privacy">
      <p>
        Our <Link to="/privacy" className="font-bold text-[#1E88FF] hover:underline">Privacy Policy</Link>{' '}
        explains how we handle personal data.
      </p>
    </Section>
  </LegalLayout>
);

export default TermsOfService;
