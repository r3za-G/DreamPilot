export type Lesson = {
  id: number;
  title: string;
  description: string;
  duration: string;
  level: number;
  locked?: boolean; 
  content: LessonContent;
};

export type LessonContent = {
  sections: LessonSection[];
  quiz?: QuizQuestion[];
  practiceTask?: string;
};

export type LessonSection = {
  type: 'text' | 'heading' | 'bullet' | 'tip' | 'exercise';
  content: string;
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: 'What is Lucid Dreaming?',
    description: 'Learn the basics and what makes a dream "lucid"',
    duration: '5 min',
    level: 1,
    content: {
      sections: [
        {
          type: 'heading',
          content: 'Welcome to Lucid Dreaming',
        },
        {
          type: 'text',
          content: 'A lucid dream is a dream where you become aware that you\'re dreaming while still asleep. In this state, you can often control aspects of the dream environment and narrative.',
        },
        {
          type: 'heading',
          content: 'Why Lucid Dream?',
        },
        {
          type: 'bullet',
          content: '• Overcome nightmares and anxiety\n• Practice real-world skills\n• Experience impossible scenarios\n• Enhance creativity\n• Explore your subconscious',
        },
        {
          type: 'tip',
          content: '💡 Tip: About 55% of people have experienced at least one lucid dream in their lifetime. With practice, you can have them regularly!',
        },
        {
          type: 'text',
          content: 'Lucid dreaming is a learnable skill. Just like learning to ride a bike, it takes practice, but almost everyone can do it with the right techniques.',
        },
        {
          type: 'exercise',
          content: '📝 Your Task: Tonight before bed, say to yourself "I will remember my dreams tonight." This is your first step toward lucidity!',
        },
      ],
      practiceTask: 'Set an intention to remember your dreams tonight',
    },
  },
  {
    id: 2,
    title: 'Your First Reality Check',
    description: 'Master the finger-through-palm technique',
    duration: '4 min',
    level: 1,
    content: {
      sections: [
        {
          type: 'heading',
          content: 'What is a Reality Check?',
        },
        {
          type: 'text',
          content: 'A reality check is a test you perform to determine whether you\'re dreaming or awake. By making this a habit during the day, you\'ll naturally do it in dreams too - triggering lucidity!',
        },
        {
          type: 'heading',
          content: 'The Finger-Palm Reality Check',
        },
        {
          type: 'bullet',
          content: '• Look at your hand\n• Try to push your finger through your palm\n• In waking life: It stops (solid)\n• In a dream: It passes through! ✨',
        },
        {
          type: 'tip',
          content: '🎯 Pro Tip: Don\'t just do the motion mindlessly. Really question "Am I dreaming?" and expect your finger to go through. This mindset is crucial!',
        },
        {
          type: 'text',
          content: 'The key is to do this check multiple times per day, especially when something unusual happens. This builds a habit that carries into your dreams.',
        },
        {
          type: 'heading',
          content: 'When to Reality Check',
        },
        {
          type: 'bullet',
          content: '• Every time you walk through a doorway\n• When you see something unusual\n• After checking your phone\n• When you feel strong emotions\n• At least 10 times per day',
        },
        {
          type: 'exercise',
          content: '✅ Today\'s Goal: Perform 10 finger-palm reality checks. Set reminders on your phone if needed!',
        },
      ],
      practiceTask: 'Perform 10 reality checks throughout today',
    },
  },
  {
    id: 3,
    title: 'Dream Journaling 101',
    description: 'Why writing dreams down changes everything',
    duration: '6 min',
    level: 1,
    content: {
      sections: [
        {
          type: 'heading',
          content: 'The Power of Dream Journaling',
        },
        {
          type: 'text',
          content: 'Dream journaling is THE most important habit for lucid dreaming. It trains your brain to value dreams, improves recall, and helps you identify dream signs.',
        },
        {
          type: 'heading',
          content: 'How to Journal Effectively',
        },
        {
          type: 'bullet',
          content: '• Write immediately upon waking\n• Record everything, even fragments\n• Include emotions and sensations\n• Note any recurring themes or symbols\n• Don\'t worry about grammar or spelling',
        },
        {
          type: 'tip',
          content: '⏰ Set your alarm 15 minutes earlier to give yourself time to journal without rushing.',
        },
        {
          type: 'text',
          content: 'Even if you think you don\'t remember dreams, sitting with your journal for a few minutes often brings back fragments. Your recall will improve dramatically within weeks.',
        },
        {
          type: 'heading',
          content: 'What to Look For',
        },
        {
          type: 'bullet',
          content: '• Recurring locations (your "dream house")\n• Impossible events you accepted as normal\n• Familiar people acting strangely\n• Common themes (flying, being chased)\n• Time periods that feel off',
        },
        {
          type: 'exercise',
          content: '📖 Challenge: Journal your dreams for 7 consecutive days. Most people see major recall improvement by day 5!',
        },
      ],
      practiceTask: 'Start a 7-day dream journaling streak',
    },
  },
  {
    id: 4,
    title: 'The MILD Technique',
    description: 'Mnemonic Induction of Lucid Dreams',
    duration: '8 min',
    level: 2,
    content: {
      sections: [
        {
          type: 'heading',
          content: 'What is MILD?',
        },
        {
          type: 'text',
          content: 'MILD (Mnemonic Induction of Lucid Dreams) is one of the most effective techniques for beginners. It uses intention-setting and visualization to trigger lucidity.',
        },
        {
          type: 'heading',
          content: 'The MILD Process',
        },
        {
          type: 'bullet',
          content: '1. When you wake from a dream, recall it in detail\n2. Identify a dream sign (something unusual)\n3. Visualize yourself becoming lucid at that sign\n4. Repeat: "Next time I\'m dreaming, I will remember I\'m dreaming"\n5. Focus on this intention as you fall back asleep',
        },
        {
          type: 'tip',
          content: '🌙 Best time: After waking during REM sleep (5-6 hours into sleep). Set an alarm!',
        },
        {
          type: 'text',
          content: 'The key is genuine intention, not just repeating words mindlessly. Really mean it when you set your intention.',
        },
        {
          type: 'exercise',
          content: '🎯 Tonight: Set an alarm for 5 hours after you sleep. When it goes off, practice MILD for 5-10 minutes before going back to sleep.',
        },
      ],
      practiceTask: 'Practice MILD technique tonight with a 5-hour alarm',
    },
  },
  {
    id: 5,
    title: 'Dream Signs & Patterns',
    description: 'Recognize your personal dream triggers',
    duration: '7 min',
    level: 2,
    content: {
      sections: [
        {
          type: 'heading',
          content: 'What are Dream Signs?',
        },
        {
          type: 'text',
          content: 'Dream signs are recurring themes, people, places, or impossible events that appear in your dreams. Recognizing them is like having a cheat code for lucidity!',
        },
        {
          type: 'heading',
          content: 'Types of Dream Signs',
        },
        {
          type: 'bullet',
          content: '• Action: Flying, running slowly, teeth falling out\n• Context: Being back in school, wrong house layout\n• Form: People looking different, hybrid animals\n• Awareness: Knowing impossible facts, time jumps',
        },
        {
          type: 'text',
          content: 'Review your dream journal weekly to identify patterns. After 20+ dream entries, clear patterns usually emerge.',
        },
        {
          type: 'tip',
          content: '📊 Use the tags in Dream Pilot to track your most common themes!',
        },
        {
          type: 'heading',
          content: 'Training Your Awareness',
        },
        {
          type: 'text',
          content: 'Once you identify your top 3 dream signs, do a reality check every time you encounter them in waking life. If "water" is a dream sign, check reality every time you see water.',
        },
        {
          type: 'exercise',
          content: '🔍 Assignment: Review your last 10 dreams and list your top 3 most common dream signs.',
        },
      ],
      practiceTask: 'Identify your top 3 dream signs from your journal',
    },
  },
];
// Future lessons can be added here with increasing complexity