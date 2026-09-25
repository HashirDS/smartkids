import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from './LegalLayout';

// Public page for parents and schools: how AI Tutor keeps children aged 3-6 safe.
const ChildSafety = () => (
  <LegalLayout
    title="Child Safety"
    description="How AI Tutor keeps young children safe: no strangers, no ads, safe AI, parental control over data."
    intro="AI Tutor is made for children aged 3 to 6 in preschool, nursery, prep and KG1. Everything is designed so a small child can learn safely, and so parents and schools stay in control."
  >
    <Section title="Grown-ups create every child account">
      <p>
        Children cannot sign up on their own. A child&apos;s account is made by a parent or guardian, who
        ticks a consent box, or by the child&apos;s school, which collects consent from parents. Children log
        in with a simple made-up login, never their own email.
      </p>
    </Section>

    <Section title="No strangers, no sharing, no ads">
      <List
        items={[
          'Children cannot message or chat with other people. There are no public profiles, comments or uploads.',
          'There is no advertising and no in-app buying, and we never sell data.',
          'Only the child, their parents, their own teachers, their principal and our support team can see their progress.',
        ]}
      />
    </Section>

    <Section title="Safe AI">
      <List
        items={[
          'Before a question reaches an AI service, we remove names, emails, phone numbers, ID-card numbers, logins and web links.',
          'The AI is told to talk only about safe learning topics and never to ask for personal details.',
          'Every AI answer is checked before a child sees it. Answers with unsuitable words are replaced with a friendly learning suggestion, and web links are removed.',
          'Voice practice recordings are deleted right after they are turned into text, and are never used to train anyone\'s AI models.',
        ]}
      />
    </Section>

    <Section title="Healthy habits">
      <p>
        Lessons are short, rewards are stickers and badges (never money or prizes), and streaks simply count
        days of learning. We encourage learning together with a grown-up, and short sessions for young
        children.
      </p>
    </Section>

    <Section title="Parents are in control">
      <List
        items={[
          "See your child's progress, quizzes, stickers and badges on your parent page.",
          "Download all of your child's data, or delete it for good, at any time from the parent page.",
          'Turn the weekly email off, or delete your parent account.',
          'Ask your school to turn off any lesson for your child\'s class.',
        ]}
      />
    </Section>

    <Section title="Islamic studies content">
      <p>
        Islamic studies lessons use simple, respectful text and no pictures of people or prophets. The
        content is checked by a qualified scholar before children use it, and schools can switch the
        lesson off at any time.
      </p>
    </Section>

    <Section title="Report a concern">
      <p>
        If anything on AI Tutor worries you, or you think a child&apos;s account has been misused, email{' '}
        <a href="mailto:contact@datixai.com" className="font-bold text-[#1E88FF] hover:underline">contact@datixai.com</a>.
        We reply within two working days and act straight away on anything that puts a child at risk.
      </p>
      <p>
        See also our <Link to="/privacy" className="font-bold text-[#1E88FF] hover:underline">Privacy Policy</Link>{' '}
        and <Link to="/terms" className="font-bold text-[#1E88FF] hover:underline">Terms</Link>.
      </p>
    </Section>
  </LegalLayout>
);

export default ChildSafety;
