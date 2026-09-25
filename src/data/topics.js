// Content for the topic lessons: Islamic studies, Science and Animals.
// Each lesson has topics (tabs); each card is tapped to hear it and saved as "<topic>:<id>".
// Islamic studies needs a scholar's review before it is used with children (see docs/PROJECT_PLAN.md, M4).
// No pictures of people or prophets are used anywhere in these lessons.

export const ISLAMIC_REVIEWED = false;

export const TOPIC_LESSONS = {
  islamic: {
    title: 'Islamic Studies',
    subtitle: 'Learn the basics of Islam with short, kind lessons.',
    color: '#DDF7E6',
    topics: [
      {
        key: 'pillars',
        label: 'Five Pillars',
        intro: 'Islam is built on five pillars.',
        items: [
          { id: 'shahadah', emoji: '☝️', title: 'Shahadah', arabic: 'الشَّهَادَة', text: 'Believing and saying: there is no god but Allah, and Muhammad is His Messenger.', say: 'The first pillar is Shahadah. We believe and say: there is no god but Allah, and Muhammad, peace be upon him, is His Messenger.' },
          { id: 'salah', emoji: '🕌', title: 'Salah', arabic: 'الصَّلَاة', text: 'Praying to Allah five times every day.', say: 'The second pillar is Salah. We pray to Allah five times every day.' },
          { id: 'zakah', emoji: '🤲', title: 'Zakah', arabic: 'الزَّكَاة', text: 'Giving part of our money to people in need.', say: 'The third pillar is Zakah. We give part of our money to people in need.' },
          { id: 'sawm', emoji: '🌙', title: 'Sawm', arabic: 'الصَّوْم', text: 'Fasting in the month of Ramadan.', say: 'The fourth pillar is Sawm. Grown-ups fast in the month of Ramadan.' },
          { id: 'hajj', emoji: '🕋', title: 'Hajj', arabic: 'الحَجّ', text: 'Visiting the Kaaba in Makkah once in life, for those who are able.', say: 'The fifth pillar is Hajj. Visiting the Kaaba in Makkah once in life, for those who are able.' },
        ],
      },
      {
        key: 'wudu',
        label: 'Wudu steps',
        intro: 'We make wudu to be clean before we pray.',
        items: [
          { id: 'niyyah', emoji: '💭', title: '1. Intention and Bismillah', text: 'Make the intention in your heart and say Bismillah.', say: 'Step one. Make the intention in your heart, and say Bismillah.' },
          { id: 'hands', emoji: '👐', title: '2. Wash hands', text: 'Wash both hands up to the wrists, three times.', say: 'Step two. Wash both hands up to the wrists, three times.' },
          { id: 'mouth', emoji: '👄', title: '3. Rinse mouth', text: 'Rinse your mouth, three times.', say: 'Step three. Rinse your mouth, three times.' },
          { id: 'nose', emoji: '👃', title: '4. Rinse nose', text: 'Put water in your nose and blow it out, three times.', say: 'Step four. Put water in your nose and blow it out, three times.' },
          { id: 'face', emoji: '😊', title: '5. Wash face', text: 'Wash your whole face, three times.', say: 'Step five. Wash your whole face, three times.' },
          { id: 'arms', emoji: '💪', title: '6. Wash arms', text: 'Wash your arms up to the elbows, right arm first, three times.', say: 'Step six. Wash your arms up to the elbows. Right arm first, three times.' },
          { id: 'head', emoji: '💧', title: '7. Wipe head', text: 'Wipe over your head with wet hands.', say: 'Step seven. Wipe over your head with wet hands.' },
          { id: 'ears', emoji: '👂', title: '8. Wipe ears', text: 'Wipe inside and behind your ears.', say: 'Step eight. Wipe inside and behind your ears.' },
          { id: 'feet', emoji: '🦶', title: '9. Wash feet', text: 'Wash your feet up to the ankles, right foot first, three times.', say: 'Step nine. Wash your feet up to the ankles. Right foot first, three times.' },
        ],
      },
      {
        key: 'prayers',
        label: 'Five prayers',
        intro: 'Muslims pray five times a day.',
        items: [
          { id: 'fajr', emoji: '🌅', title: 'Fajr', arabic: 'الفَجْر', text: 'At dawn, before the sun rises. 2 rakat.', say: 'Fajr is the dawn prayer, before the sun rises. It has two rakat.' },
          { id: 'dhuhr', emoji: '☀️', title: 'Dhuhr', arabic: 'الظُّهْر', text: 'At midday, after the sun is high. 4 rakat.', say: 'Dhuhr is the midday prayer. It has four rakat.' },
          { id: 'asr', emoji: '🌤️', title: 'Asr', arabic: 'العَصْر', text: 'In the afternoon. 4 rakat.', say: 'Asr is the afternoon prayer. It has four rakat.' },
          { id: 'maghrib', emoji: '🌇', title: 'Maghrib', arabic: 'المَغْرِب', text: 'Just after sunset. 3 rakat.', say: 'Maghrib is the prayer just after sunset. It has three rakat.' },
          { id: 'isha', emoji: '🌌', title: 'Isha', arabic: 'العِشَاء', text: 'At night. 4 rakat.', say: 'Isha is the night prayer. It has four rakat.' },
        ],
      },
      {
        key: 'names',
        label: "Allah's names",
        intro: 'Allah has beautiful names. Here are some of them.',
        items: [
          { id: 'rahman', emoji: '💚', title: 'Ar-Rahman', arabic: 'الرَّحْمٰن', text: 'The Most Merciful to everyone.', say: 'Ar-Rahman. The Most Merciful.' },
          { id: 'raheem', emoji: '🤍', title: 'Ar-Raheem', arabic: 'الرَّحِيم', text: 'The Most Kind and Caring.', say: 'Ar-Raheem. The Most Kind and Caring.' },
          { id: 'khaliq', emoji: '🌍', title: 'Al-Khaliq', arabic: 'الخَالِق', text: 'The Creator of everything.', say: 'Al-Khaliq. The Creator of everything.' },
          { id: 'razzaq', emoji: '🍞', title: 'Ar-Razzaq', arabic: 'الرَّزَّاق', text: 'The Provider, who gives us food and all we need.', say: 'Ar-Razzaq. The Provider, who gives us all we need.' },
          { id: 'salam', emoji: '🕊️', title: 'As-Salam', arabic: 'السَّلَام', text: 'The Source of Peace.', say: 'As-Salam. The Source of Peace.' },
          { id: 'samee', emoji: '👂', title: "As-Sami'", arabic: 'السَّمِيع', text: 'The All-Hearing. Allah hears every prayer.', say: 'As-Samee. The All-Hearing.' },
          { id: 'baseer', emoji: '👁️', title: 'Al-Baseer', arabic: 'البَصِير', text: 'The All-Seeing.', say: 'Al-Baseer. The All-Seeing.' },
          { id: 'aleem', emoji: '📚', title: "Al-'Aleem", arabic: 'العَلِيم', text: 'The All-Knowing.', say: 'Al-Aleem. The All-Knowing.' },
          { id: 'ghafoor', emoji: '🌧️', title: 'Al-Ghafoor', arabic: 'الغَفُور', text: 'The Most Forgiving.', say: 'Al-Ghafoor. The Most Forgiving.' },
          { id: 'wadood', emoji: '💞', title: 'Al-Wadood', arabic: 'الوَدُود', text: 'The Most Loving.', say: 'Al-Wadood. The Most Loving.' },
        ],
      },
      {
        key: 'prophets',
        label: 'Prophets',
        intro: 'Short stories of some of the Prophets, peace be upon them.',
        items: [
          { id: 'adam', emoji: '🌳', title: 'Prophet Adam (AS)', text: 'Adam was the first human. Allah taught him the names of all things.', say: 'Prophet Adam, peace be upon him, was the first human. Allah taught him the names of all things.' },
          { id: 'nuh', emoji: '🚢', title: 'Prophet Nuh (AS)', text: 'Nuh built a big ark as Allah told him. The believers and animals in pairs were saved from the great flood.', say: 'Prophet Nuh, peace be upon him, built a big ark as Allah told him. The believers, and animals in pairs, were saved from the great flood.' },
          { id: 'ibrahim', emoji: '🕋', title: 'Prophet Ibrahim (AS)', text: 'Ibrahim believed in One Allah. With his son Ismail, he built the Kaaba.', say: 'Prophet Ibrahim, peace be upon him, believed in One Allah. With his son Ismail, he built the Kaaba.' },
          { id: 'musa', emoji: '🌊', title: 'Prophet Musa (AS)', text: 'Allah kept baby Musa safe in a basket on the river. Later, Allah split the sea to save Musa and his people.', say: 'Allah kept baby Musa, peace be upon him, safe in a basket on the river. Later, Allah split the sea to save Musa and his people.' },
          { id: 'yunus', emoji: '🐋', title: 'Prophet Yunus (AS)', text: 'Yunus was swallowed by a big fish. He prayed to Allah, and Allah saved him.', say: 'Prophet Yunus, peace be upon him, was swallowed by a big fish. He prayed to Allah, and Allah saved him.' },
          { id: 'muhammad', emoji: '🕌', title: 'Prophet Muhammad ﷺ', text: 'The last Prophet, born in Makkah. People called him Al-Amin, the trustworthy. He was kind to children and animals.', say: 'Prophet Muhammad, peace be upon him, is the last Prophet. He was born in Makkah. People called him Al-Amin, the trustworthy. He was kind to children and animals.' },
        ],
      },
    ],
  },

  science: {
    title: 'Science',
    subtitle: 'Discover your body, the weather, day and night, and plants.',
    color: '#E0F1FF',
    topics: [
      {
        key: 'body',
        label: 'My body',
        intro: 'We use our five senses every day.',
        items: [
          { id: 'eyes', emoji: '👀', title: 'Eyes', text: 'We see with our eyes.', say: 'Eyes. We see with our eyes.' },
          { id: 'ears', emoji: '👂', title: 'Ears', text: 'We hear with our ears.', say: 'Ears. We hear with our ears.' },
          { id: 'nose', emoji: '👃', title: 'Nose', text: 'We smell with our nose.', say: 'Nose. We smell with our nose.' },
          { id: 'tongue', emoji: '👅', title: 'Tongue', text: 'We taste with our tongue.', say: 'Tongue. We taste with our tongue.' },
          { id: 'hands', emoji: '✋', title: 'Hands', text: 'We touch and feel with our hands.', say: 'Hands. We touch and feel with our hands.' },
          { id: 'heart', emoji: '❤️', title: 'Heart', text: 'Our heart pumps blood all around the body.', say: 'Heart. Our heart pumps blood all around the body.' },
        ],
      },
      {
        key: 'weather',
        label: 'Weather',
        intro: 'What is the weather like today?',
        items: [
          { id: 'sunny', emoji: '☀️', title: 'Sunny', text: 'The sun is shining. It is warm.', say: 'Sunny. The sun is shining and it is warm.' },
          { id: 'cloudy', emoji: '☁️', title: 'Cloudy', text: 'Clouds cover the sky.', say: 'Cloudy. Clouds cover the sky.' },
          { id: 'rainy', emoji: '🌧️', title: 'Rainy', text: 'Rain falls from the clouds. Take an umbrella!', say: 'Rainy. Rain falls from the clouds. Take an umbrella!' },
          { id: 'windy', emoji: '🌬️', title: 'Windy', text: 'The wind blows the trees and kites.', say: 'Windy. The wind blows the trees and kites.' },
          { id: 'snowy', emoji: '❄️', title: 'Snowy', text: 'Snow falls when it is very cold.', say: 'Snowy. Snow falls when it is very cold.' },
          { id: 'rainbow', emoji: '🌈', title: 'Rainbow', text: 'After rain, sunlight can make a rainbow.', say: 'Rainbow. After rain, sunlight can make a rainbow.' },
        ],
      },
      {
        key: 'daynight',
        label: 'Day and night',
        intro: 'The Earth turns, so we have day and night.',
        items: [
          { id: 'day', emoji: '🌞', title: 'Day', text: 'In the day, the sun gives us light.', say: 'Day. In the day, the sun gives us light.' },
          { id: 'night', emoji: '🌙', title: 'Night', text: 'At night it is dark. We see the moon.', say: 'Night. At night it is dark, and we see the moon.' },
          { id: 'stars', emoji: '⭐', title: 'Stars', text: 'Stars twinkle in the night sky.', say: 'Stars. Stars twinkle in the night sky.' },
          { id: 'earth', emoji: '🌍', title: 'Earth turns', text: 'The Earth spins. When our side faces the sun, it is day.', say: 'The Earth spins. When our side faces the sun, it is day.' },
          { id: 'sleep', emoji: '🛏️', title: 'Sleep', text: 'We sleep at night so our body can rest.', say: 'We sleep at night so our body can rest.' },
        ],
      },
      {
        key: 'plants',
        label: 'Plants',
        intro: 'Plants grow from seeds.',
        items: [
          { id: 'seed', emoji: '🫘', title: 'Seed', text: 'A plant starts from a tiny seed.', say: 'Seed. A plant starts from a tiny seed.' },
          { id: 'roots', emoji: '🌱', title: 'Roots', text: 'Roots drink water from the soil.', say: 'Roots. Roots drink water from the soil.' },
          { id: 'stem', emoji: '🌿', title: 'Stem', text: 'The stem holds the plant up.', say: 'Stem. The stem holds the plant up.' },
          { id: 'leaves', emoji: '🍃', title: 'Leaves', text: 'Leaves use sunlight to make food for the plant.', say: 'Leaves. Leaves use sunlight to make food for the plant.' },
          { id: 'flower', emoji: '🌸', title: 'Flower', text: 'Flowers make seeds for new plants.', say: 'Flower. Flowers make seeds for new plants.' },
          { id: 'needs', emoji: '💧', title: 'Plants need', text: 'Plants need water, sunlight and air to grow.', say: 'Plants need water, sunlight and air to grow.' },
        ],
      },
    ],
  },

  animals: {
    title: 'Animals',
    subtitle: 'Meet the animals and hear what they say.',
    color: '#FFF1C7',
    topics: [
      {
        key: 'farm',
        label: 'Farm',
        intro: 'Animals that live on a farm.',
        items: [
          { id: 'cow', emoji: '🐄', title: 'Cow', text: 'The cow says moo. It gives us milk.', say: 'Cow. The cow says moo! It gives us milk.' },
          { id: 'goat', emoji: '🐐', title: 'Goat', text: 'The goat says maa.', say: 'Goat. The goat says maa!' },
          { id: 'sheep', emoji: '🐑', title: 'Sheep', text: 'The sheep says baa. It gives us wool.', say: 'Sheep. The sheep says baa! It gives us wool.' },
          { id: 'hen', emoji: '🐔', title: 'Hen', text: 'The hen says cluck cluck. It lays eggs.', say: 'Hen. The hen says cluck, cluck! It lays eggs.' },
          { id: 'duck', emoji: '🦆', title: 'Duck', text: 'The duck says quack quack.', say: 'Duck. The duck says quack, quack!' },
          { id: 'horse', emoji: '🐴', title: 'Horse', text: 'The horse says neigh.', say: 'Horse. The horse says neigh!' },
        ],
      },
      {
        key: 'wild',
        label: 'Wild',
        intro: 'Animals that live in forests and jungles.',
        items: [
          { id: 'lion', emoji: '🦁', title: 'Lion', text: 'The lion roars. It is the king of the jungle.', say: 'Lion. The lion says roar! It is the king of the jungle.' },
          { id: 'elephant', emoji: '🐘', title: 'Elephant', text: 'The elephant trumpets with its long trunk.', say: 'Elephant. The elephant trumpets with its long trunk.' },
          { id: 'monkey', emoji: '🐒', title: 'Monkey', text: 'The monkey says ooh ooh aah aah.', say: 'Monkey. The monkey says ooh ooh, aah aah!' },
          { id: 'tiger', emoji: '🐅', title: 'Tiger', text: 'The tiger growls. It has stripes.', say: 'Tiger. The tiger growls. It has stripes.' },
          { id: 'giraffe', emoji: '🦒', title: 'Giraffe', text: 'The giraffe has a very long neck.', say: 'Giraffe. The giraffe has a very long neck.' },
          { id: 'snowleopard', emoji: '🐆', title: 'Snow leopard', text: 'The snow leopard lives in the mountains of Pakistan.', say: 'Snow leopard. The snow leopard lives in the mountains of Pakistan.' },
        ],
      },
      {
        key: 'sea',
        label: 'Sea',
        intro: 'Animals that live in the water.',
        items: [
          { id: 'fish', emoji: '🐟', title: 'Fish', text: 'Fish swim and breathe under water.', say: 'Fish. Fish swim and breathe under water.' },
          { id: 'whale', emoji: '🐳', title: 'Whale', text: 'The whale is the biggest animal in the sea.', say: 'Whale. The whale is the biggest animal in the sea.' },
          { id: 'dolphin', emoji: '🐬', title: 'Dolphin', text: 'Dolphins click and whistle to talk.', say: 'Dolphin. Dolphins click and whistle to talk.' },
          { id: 'turtle', emoji: '🐢', title: 'Turtle', text: 'The turtle carries its shell on its back.', say: 'Turtle. The turtle carries its shell on its back.' },
          { id: 'octopus', emoji: '🐙', title: 'Octopus', text: 'The octopus has eight arms.', say: 'Octopus. The octopus has eight arms.' },
        ],
      },
      {
        key: 'pets',
        label: 'Pets and birds',
        intro: 'Animals that live with us and fly around us.',
        items: [
          { id: 'cat', emoji: '🐱', title: 'Cat', text: 'The cat says meow.', say: 'Cat. The cat says meow!' },
          { id: 'dog', emoji: '🐶', title: 'Dog', text: 'The dog says woof woof.', say: 'Dog. The dog says woof, woof!' },
          { id: 'parrot', emoji: '🦜', title: 'Parrot', text: 'The parrot can copy words.', say: 'Parrot. The parrot can copy words!' },
          { id: 'rabbit', emoji: '🐰', title: 'Rabbit', text: 'The rabbit hops and eats carrots.', say: 'Rabbit. The rabbit hops and eats carrots.' },
          { id: 'sparrow', emoji: '🐦', title: 'Sparrow', text: 'The sparrow says chirp chirp.', say: 'Sparrow. The sparrow says chirp, chirp!' },
        ],
      },
    ],
  },
};

export const itemCount = (lessonKey) =>
  TOPIC_LESSONS[lessonKey].topics.reduce((sum, topic) => sum + topic.items.length, 0);
