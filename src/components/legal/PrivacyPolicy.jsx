import React from 'react';
import { Link } from 'react-router-dom';
import LegalLayout, { Section, List } from './LegalLayout';

const PrivacyPolicy = () => (
  <LegalLayout
    title="Privacy Policy"
    description="How AI Tutor collects, uses and protects personal data of schools, teachers, parents and children."
    intro="AI Tutor is an early-learning platform used by schools, academies, parents and young children. We collect as little personal data as we can, we never sell it, and we do not show advertising. This policy explains what we collect and why."
  >
    <Section title="Who is responsible for your data">
      <p>
        AI Tutor is operated by XactGen and Datix AI (&quot;we&quot;, &quot;us&quot;). We are the data
        controller for accounts created directly with us. When a school or academy creates accounts for
        its students, the school decides how its students use AI Tutor and we process that data on the
        school&apos;s behalf.
      </p>
    </Section>

    <Section title="What we collect">
      <List
        items={[
          'Account details: first and last name, email address, account type (student, teacher or admin) and a securely hashed password. We never store passwords in readable form.',
          'Learning data: lessons and items completed, quiz answers and scores, and speech-practice results (what the child was asked to say, what was heard and an accuracy score).',
          'Voice recordings: when a child uses the microphone, the short recording is sent to our speech-recognition provider to be turned into text. We delete the recording straight after and do not keep audio.',
          'Questions typed to the 3D teacher or learning assistant, which are sent to an AI provider to create an answer.',
          'Technical data: IP address, browser type and request logs, used to keep the service secure (for example, to stop password guessing) and to fix problems.',
        ]}
      />
    </Section>

    <Section title="Children's privacy">
      <p>
        AI Tutor is designed for children, so we take extra care. A child account should be created by a
        parent, guardian, teacher or school who agrees to this policy on the child&apos;s behalf. We only
        collect what is needed to teach and to show progress, we do not use children&apos;s data for
        advertising or profiling, and children cannot share personal information publicly through AI Tutor.
      </p>
      <p>
        Parents and guardians can ask to see, correct or delete their child&apos;s data at any time by
        emailing us. We handle children&apos;s data in line with laws such as the EU and UK GDPR, the US
        Children&apos;s Online Privacy Protection Act (COPPA), Canada&apos;s PIPEDA and Pakistan&apos;s
        applicable data-protection and electronic-crimes laws.
      </p>
    </Section>

    <Section title="How we use data">
      <List
        items={[
          'To create and secure accounts and let users log in.',
          'To run lessons, quizzes, speech practice and the 3D teacher.',
          'To show progress to the child, their parents and their teachers.',
          'To keep the service safe, prevent abuse and fix errors.',
          'To reply when you contact us.',
        ]}
      />
      <p>
        Where the GDPR applies, we rely on performing our contract with you or your school, our legitimate
        interest in keeping the service secure, and consent where the law requires it.
      </p>
    </Section>

    <Section title="Who we share data with">
      <p>
        We use trusted service providers who process data only to run AI Tutor: website and server hosting,
        a cloud database, AI language-model providers that answer questions and create quizzes and poems,
        and speech providers that read text aloud and recognise speech. Some of these providers are located
        outside your country, including in the United States and the European Union; we use them only
        with appropriate safeguards. We do not sell or rent personal data to anyone.
      </p>
    </Section>

    <Section title="How long we keep data">
      <p>
        We keep account and learning data while the account is active. Login sessions expire after 30
        days, and security counters are deleted automatically within minutes to hours. When an account is
        deleted, its profile and progress are removed from our active database.
      </p>
    </Section>

    <Section title="Your rights">
      <p>
        Depending on where you live, you can ask to access, correct, delete or export your data, object to
        or restrict how we use it, and withdraw consent. You can also complain to your local
        data-protection authority. To use these rights, email us from the address on the account.
      </p>
    </Section>

    <Section title="Security">
      <p>
        Passwords are hashed, connections are encrypted with HTTPS, sessions expire, and login attempts are
        rate-limited. No system is perfectly secure, so please use a strong password and tell us straight
        away if you think an account has been misused.
      </p>
    </Section>

    <Section title="Cookies">
      <p>
        We only use storage that is needed to run the site. See our{' '}
        <Link to="/cookies" className="font-bold text-[#1E88FF] hover:underline">Cookie Policy</Link>.
      </p>
    </Section>

    <Section title="Changes to this policy">
      <p>
        We may update this policy as AI Tutor grows. We will change the date at the top and, for important
        changes, tell account holders by email or in the app.
      </p>
    </Section>
  </LegalLayout>
);

export default PrivacyPolicy;
