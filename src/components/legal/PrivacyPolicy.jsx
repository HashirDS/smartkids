import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from './LegalLayout';

const PROVIDERS = [
  ['MongoDB Atlas', 'Cloud database for accounts and learning records'],
  ['Vercel', 'Website and server hosting; visitor statistics on public pages (only if accepted)'],
  ['Microsoft Azure Speech', 'Reads lesson text aloud (text only)'],
  ['Google Text-to-Speech', 'Backup voice for reading lesson text aloud (text only)'],
  ['Deepgram', "Turns a child's short speech recording into text for pronunciation practice"],
  ['Groq, Google Gemini, Replicate, Hugging Face', 'AI answers, poems and quiz questions (personal details removed first)'],
  ['Resend', 'Sends the weekly progress email to parents'],
  ['Sentry', 'Error reports so we can fix problems (names, emails and logins removed first)'],
];

const PrivacyPolicy = () => (
  <LegalLayout
    title="Privacy Policy"
    description="How AI Tutor collects, uses and protects the data of schools, principals, teachers, parents and children."
    intro="AI Tutor is an early-learning platform for children aged 3 to 6, used by schools, principals, teachers and parents. We collect as little personal data as we can, never sell it and never show advertising. This policy explains what we collect about each person, why, and how you stay in control."
  >
    <Section title="Who is responsible for your data">
      <p>
        AI Tutor is operated by XactGen and Datix AI (&quot;we&quot;, &quot;us&quot;). When a school uses
        AI Tutor, the <b>school is responsible</b> for its students&apos; and teachers&apos; data and for
        getting parents&apos; consent, and we process that data on the school&apos;s instructions. When a
        parent signs up directly (for example on the join page), we are responsible for that data.
      </p>
    </Section>

    <Section title="What we collect, person by person">
      <p><b>Schools and principals:</b> school name, city and country; the principal&apos;s name and email.</p>
      <p><b>Teachers:</b> name, email, and which classes they teach.</p>
      <p>
        <b>Parents and guardians:</b> name, email, phone number (optional), which children are linked to them,
        the date they gave consent, and whether they want the weekly email.
      </p>
      <p><b>Children:</b></p>
      <List
        items={[
          'First name and (optionally) last name, class, school and level. A child logs in with a made-up login such as ali1234@kids.aitutor, never their own email.',
          "Their parent's contact details, if the school enters them.",
          'Learning records: items learned, quiz answers and scores, speech-practice results (the word asked for, the word heard and a score), stickers, badges and the days they learned (for streaks).',
          'Voice: when the child presses the microphone, a short recording is sent for speech recognition and then deleted. We do not keep audio.',
        ]}
      />
      <p>
        <b>Everyone:</b> a securely hashed password (never readable), and technical data such as IP address
        and browser type, used only to keep the service secure and working.
      </p>
      <p>We do not collect photos, video, exact location, contacts, or any payment details.</p>
    </Section>

    <Section title="Children's privacy">
      <List
        items={[
          'Every child account is created by a parent or guardian who ticks a consent box, or by a school that collects parental consent. Children cannot sign up by themselves.',
          'We only collect what is needed to teach and to show progress. No advertising, no profiling, no selling of data.',
          'Children cannot chat with other people, share anything publicly, or upload photos.',
          'Before any question goes to an AI service, we remove names, emails, phone numbers, ID-card numbers, logins and web links. AI answers are checked, and anything unsuitable or any web link is removed.',
          'Visitor statistics never run on lessons or dashboards.',
        ]}
      />
      <p>
        Read more on our <Link to="/child-safety" className="font-bold text-[#1E88FF] hover:underline">Child Safety</Link> page.
      </p>
    </Section>

    <Section title="How we use data">
      <List
        items={[
          'To create and secure accounts and let people log in.',
          'To run lessons, quizzes, speech practice, the 3D teacher and rewards.',
          "To show a child's progress to the child, their parents, their teachers and their principal.",
          'To send parents the weekly progress email (they can turn it off at any time).',
          'To keep the service safe, prevent abuse and fix errors.',
        ]}
      />
      <p>
        Where the GDPR applies, we rely on the contract with you or your school, parental consent for
        children, and our legitimate interest in keeping the service secure.
      </p>
    </Section>

    <Section title="Who can see a child's data">
      <List
        items={[
          'The child, when logged in.',
          'Their linked parents or guardians.',
          "The teachers of the child's class, and the principal of the child's school.",
          'AI Tutor administrators, only to run and support the service.',
        ]}
      />
      <p>Teachers and principals can only see children in their own classes and school.</p>
    </Section>

    <Section title="Service providers">
      <p>We use these providers only to run AI Tutor. Some are outside Pakistan (for example in the US and EU) and are used with appropriate safeguards.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <tbody>
            {PROVIDERS.map(([name, use]) => (
              <tr key={name} className="border-b border-[#EEE9DD] align-top">
                <td className="py-2 pr-4 font-bold text-[#1E2A55]">{name}</td>
                <td className="py-2">{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>

    <Section title="How long we keep data">
      <p>
        We keep account and learning data while the account is in use. Login sessions end after 30 days.
        When a parent, school or administrator deletes a child&apos;s account, we delete the child&apos;s
        profile, progress, quizzes, rewards and sessions straight away and keep only an anonymous note that
        a deletion happened (no names).
      </p>
    </Section>

    <Section title="Your rights and choices">
      <List
        items={[
          "Parents can download all of their child's data, or delete it, from the parent page at any time.",
          'Parents can delete their own parent account and turn the weekly email off.',
          'Schools can move, edit or remove students and teachers, and turn lessons off.',
          'Anyone can ask us to access, correct, export or delete their data, or object to how it is used, by emailing contact@datixai.com. You can also complain to your data-protection authority.',
        ]}
      />
    </Section>

    <Section title="Security">
      <p>
        Passwords are hashed, connections use HTTPS, sessions expire, login attempts are limited, and staff
        only see the children they teach. Please use a strong password and tell us straight away if you
        think an account has been misused.
      </p>
    </Section>

    <Section title="Cookies">
      <p>
        We only use storage the site needs, plus cookie-free visitor statistics on public pages if you
        accept. See our <Link to="/cookies" className="font-bold text-[#1E88FF] hover:underline">Cookie Policy</Link>.
      </p>
    </Section>

    <Section title="Changes to this policy">
      <p>
        We will update the date at the top when this policy changes and, for important changes, tell
        schools and parents by email or in the app.
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPolicy;
