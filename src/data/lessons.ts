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
  type: "text" | "heading" | "bullet" | "tip" | "exercise";
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
    title: "What is Lucid Dreaming?",
    description: 'Learn the basics and what makes a dream "lucid"',
    duration: "5 min",
    level: 1,
    content: {
      sections: [
        {
          type: "heading",
          content: "Welcome to Lucid Dreaming",
        },
        {
          type: "text",
          content:
            "A lucid dream is a dream where you become aware that you're dreaming while still asleep. In this state, you can often control aspects of the dream environment and narrative.",
        },
        {
          type: "heading",
          content: "Why Lucid Dream?",
        },
        {
          type: "bullet",
          content:
            "Overcome nightmares and anxiety\n Practice real-world skills\n• Experience impossible scenarios\n• Enhance creativity\n• Explore your subconscious",
        },
        {
          type: "tip",
          content:
            "About 55% of people have experienced at least one lucid dream in their lifetime. With practice, you can have them regularly!",
        },
        {
          type: "text",
          content:
            "Lucid dreaming is a learnable skill. Just like learning to ride a bike, it takes practice, but almost everyone can do it with the right techniques.",
        },
        {
          type: "exercise",
          content:
            '📝 Your Task: Tonight before bed, say to yourself "I will remember my dreams tonight." This is your first step toward lucidity!',
        },
      ],
      practiceTask: "Set an intention to remember your dreams tonight",
    },
  },
  {
    id: 2,
    title: "Your First Reality Check",
    description: "Master the finger-through-palm technique",
    duration: "4 min",
    level: 1,
    content: {
      sections: [
        {
          type: "heading",
          content: "What is a Reality Check?",
        },
        {
          type: "text",
          content:
            "A reality check is a test you perform to determine whether you're dreaming or awake. By making this a habit during the day, you'll naturally do it in dreams too - triggering lucidity!",
        },
        {
          type: "heading",
          content: "The Finger-Palm Reality Check",
        },
        {
          type: "bullet",
          content:
            "Look at your hand\n• Try to push your finger through your palm\n• In waking life: It stops (solid)\n• In a dream: It passes through! ✨",
        },
        {
          type: "tip",
          content:
            'Don\'t just do the motion mindlessly. Really question "Am I dreaming?" and expect your finger to go through. This mindset is crucial!',
        },
        {
          type: "text",
          content:
            "The key is to do this check multiple times per day, especially when something unusual happens. This builds a habit that carries into your dreams.",
        },
        {
          type: "heading",
          content: "When to Reality Check",
        },
        {
          type: "bullet",
          content:
            "• Every time you walk through a doorway\n• When you see something unusual\n• After checking your phone\n• When you feel strong emotions\n• At least 10 times per day",
        },
        {
          type: "exercise",
          content:
            "✅ Today's Goal: Perform 10 finger-palm reality checks. Set reminders on your phone if needed!",
        },
      ],
      practiceTask: "Perform 10 reality checks throughout today",
    },
  },
  {
    id: 3,
    title: "Dream Journaling 101",
    description: "Why writing dreams down changes everything",
    duration: "6 min",
    level: 1,
    content: {
      sections: [
        {
          type: "heading",
          content: "The Power of Dream Journaling",
        },
        {
          type: "text",
          content:
            "Dream journaling is THE most important habit for lucid dreaming. It trains your brain to value dreams, improves recall, and helps you identify dream signs.",
        },
        {
          type: "heading",
          content: "How to Journal Effectively",
        },
        {
          type: "bullet",
          content:
            "• Write immediately upon waking\n• Record everything, even fragments\n• Include emotions and sensations\n• Note any recurring themes or symbols\n• Don't worry about grammar or spelling",
        },
        {
          type: "tip",
          content:
            "Set your alarm 15 minutes earlier to give yourself time to journal without rushing.",
        },
        {
          type: "text",
          content:
            "Even if you think you don't remember dreams, sitting with your journal for a few minutes often brings back fragments. Your recall will improve dramatically within weeks.",
        },
        {
          type: "heading",
          content: "What to Look For",
        },
        {
          type: "bullet",
          content:
            '• Recurring locations (your "dream house")\n• Impossible events you accepted as normal\n• Familiar people acting strangely\n• Common themes (flying, being chased)\n• Time periods that feel off',
        },
        {
          type: "exercise",
          content:
            "📖 Challenge: Journal your dreams for 7 consecutive days. Most people see major recall improvement by day 5!",
        },
      ],
      practiceTask: "Start a 7-day dream journaling streak",
    },
  },
  {
    id: 4,
    title: "The MILD Technique",
    description: "Mnemonic Induction of Lucid Dreams",
    duration: "8 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "What is MILD?",
        },
        {
          type: "text",
          content:
            "MILD (Mnemonic Induction of Lucid Dreams) is one of the most effective techniques for beginners. It uses intention-setting and visualization to trigger lucidity.",
        },
        {
          type: "heading",
          content: "The MILD Process",
        },
        {
          type: "bullet",
          content:
            "When you wake from a dream, recall it in detail\n Identify a dream sign (something unusual)\n Visualize yourself becoming lucid at that sign\n Repeat: \"Next time I'm dreaming, I will remember I'm dreaming\"\n Focus on this intention as you fall back asleep",
        },
        {
          type: "tip",
          content:
            "Best time: After waking during REM sleep (5-6 hours into sleep). Set an alarm!",
        },
        {
          type: "text",
          content:
            "The key is genuine intention, not just repeating words mindlessly. Really mean it when you set your intention.",
        },
        {
          type: "exercise",
          content:
            "🎯 Tonight: Set an alarm for 5 hours after you sleep. When it goes off, practice MILD for 5-10 minutes before going back to sleep.",
        },
      ],
      practiceTask: "Practice MILD technique tonight with a 5-hour alarm",
    },
  },
  {
    id: 5,
    title: "Dream Signs & Patterns",
    description: "Recognize your personal dream triggers",
    duration: "7 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "What are Dream Signs?",
        },
        {
          type: "text",
          content:
            "Dream signs are recurring themes, people, places, or impossible events that appear in your dreams. Recognizing them is like having a cheat code for lucidity!",
        },
        {
          type: "heading",
          content: "Types of Dream Signs",
        },
        {
          type: "bullet",
          content:
            "• Action: Flying, running slowly, teeth falling out\n• Context: Being back in school, wrong house layout\n• Form: People looking different, hybrid animals\n• Awareness: Knowing impossible facts, time jumps",
        },
        {
          type: "text",
          content:
            "Review your dream journal weekly to identify patterns. After 20+ dream entries, clear patterns usually emerge.",
        },
        {
          type: "tip",
          content:
            "Use the tags in Dream Pilot to track your most common themes!",
        },
        {
          type: "heading",
          content: "Training Your Awareness",
        },
        {
          type: "text",
          content:
            'Once you identify your top 3 dream signs, do a reality check every time you encounter them in waking life. If "water" is a dream sign, check reality every time you see water.',
        },
        {
          type: "exercise",
          content:
            "🔍 Assignment: Review your last 10 dreams and list your top 3 most common dream signs.",
        },
      ],
      practiceTask: "Identify your top 3 dream signs from your journal",
    },
  },
  {
    id: 6,
    title: "WBTB: Wake Back to Bed",
    description: "The most powerful technique for inducing lucid dreams",
    duration: "6 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "What is WBTB?",
        },
        {
          type: "text",
          content:
            "Wake Back to Bed (WBTB) involves waking up during REM sleep, staying awake briefly, then going back to sleep with heightened awareness. This dramatically increases your chances of lucidity.",
        },
        {
          type: "heading",
          content: "How to Do WBTB",
        },
        {
          type: "bullet",
          content:
            "• Sleep for 5-6 hours normally\n• Set an alarm and wake up\n• Stay awake for 20-45 minutes\n• Read about lucid dreaming or review dreams\n• Return to bed with strong intention\n• Combine with MILD for best results",
        },
        {
          type: "tip",
          content:
            "Don't use bright screens! Dim lighting helps you fall back asleep while maintaining awareness.",
        },
        {
          type: "text",
          content:
            "WBTB works because you're waking during peak REM sleep, when dreams are longest and most vivid. Your brain is primed for lucidity when you return to sleep.",
        },
        {
          type: "exercise",
          content:
            "🌙 This weekend: Try WBTB when you can sleep in. Wake after 5-6 hours, stay up 30 minutes, then use MILD to fall back asleep.",
        },
      ],
      practiceTask: "Try WBTB technique on a weekend morning",
    },
  },
  {
    id: 7,
    title: "Stabilizing Your Lucid Dream",
    description: "Don't wake up! Learn to extend dream time",
    duration: "7 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "The Excitement Problem",
        },
        {
          type: "text",
          content:
            "Many beginners get lucid for the first time, get too excited, and immediately wake up. Stabilization techniques help you stay in the dream longer.",
        },
        {
          type: "heading",
          content: "Stabilization Techniques",
        },
        {
          type: "bullet",
          content:
            '• Rub your hands together (creates sensory grounding)\n• Spin in circles (resets the dream scene)\n• Touch objects and feel their texture\n• Shout "Increase clarity!" or "Stabilize!"\n• Look at your hands periodically\n• Stay calm - excitement = waking',
        },
        {
          type: "tip",
          content:
            "If the dream starts fading, DROP to the ground and touch it. This grounds you in the dream world!",
        },
        {
          type: "text",
          content:
            "The key is engaging your senses. The more you interact with the dream environment, the more stable and vivid it becomes.",
        },
        {
          type: "heading",
          content: "What NOT to Do",
        },
        {
          type: "bullet",
          content:
            "• Don't think about your physical body\n• Avoid staring at one spot too long\n• Don't get too excited (breathe calmly)\n• Don't try to control everything at once",
        },
        {
          type: "exercise",
          content:
            "💭 Mental practice: Visualize yourself becoming lucid, rubbing hands, and staying calm. This mental rehearsal actually works!",
        },
      ],
      practiceTask: "Visualize stabilization techniques before sleep",
    },
  },
  {
    id: 8,
    title: "Advanced Reality Checks",
    description: "5 reality checks beyond the basics",
    duration: "6 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "Diversify Your Reality Checks",
        },
        {
          type: "text",
          content:
            "Using multiple reality checks prevents your brain from adapting. Here are 5 powerful techniques to add to your practice.",
        },
        {
          type: "heading",
          content: "1. Reading Text",
        },
        {
          type: "text",
          content:
            "In dreams, text changes when you look away and back. Find any text (sign, book, phone), read it, look away, look back. Different? You're dreaming!",
        },
        {
          type: "heading",
          content: "2. Light Switches",
        },
        {
          type: "text",
          content:
            "Light switches rarely work properly in dreams. Try flipping a switch multiple times and observe what happens.",
        },
        {
          type: "heading",
          content: "3. Nose Pinch",
        },
        {
          type: "text",
          content:
            "Pinch your nose shut and try to breathe. In waking life: no air. In dreams: you can still breathe! This is very reliable.",
        },
        {
          type: "heading",
          content: "4. Time Checks",
        },
        {
          type: "text",
          content:
            "Look at a clock, look away, look back. If the time has changed drastically or looks strange, you're dreaming.",
        },
        {
          type: "heading",
          content: "5. Finger Count",
        },
        {
          type: "text",
          content:
            "Count your fingers slowly. In dreams, you might have too many, too few, or they may look distorted.",
        },
        {
          type: "tip",
          content:
            "Combine checks! Do 2-3 different reality checks in succession for maximum effectiveness.",
        },
        {
          type: "exercise",
          content:
            "🎯 This week: Add 3 new reality check types to your daily practice. Variety is key!",
        },
      ],
      practiceTask: "Add 3 new reality check types to your daily routine",
    },
  },
  {
    id: 9,
    title: "Dream Control Basics",
    description: "Start manipulating your dream environment",
    duration: "8 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "Expectations Shape Reality",
        },
        {
          type: "text",
          content:
            "In lucid dreams, your expectations create reality. If you believe you can fly, you will. If you doubt, you won't. Confidence is everything!",
        },
        {
          type: "heading",
          content: "Starting Small",
        },
        {
          type: "bullet",
          content:
            "• Levitation: Start by hovering a few inches\n• Object manipulation: Move small items first\n• Light control: Make it brighter or darker\n• Weather: Change from clear to cloudy\n• Colors: Shift the hue of objects",
        },
        {
          type: "text",
          content:
            "Don't try to do everything at once! Master one skill before moving to the next. Small successes build confidence for bigger control.",
        },
        {
          type: "heading",
          content: "Flying Techniques",
        },
        {
          type: "bullet",
          content:
            "• Expect it to work (crucial!)\n• Start with small jumps\n• Swim through the air\n• Imagine being pulled upward\n• Superman pose for speed",
        },
        {
          type: "tip",
          content:
            "If flying fails, try a 'cheat' - put on wings, use a jetpack, or climb stairs that go up forever. These work by leveraging dream logic!",
        },
        {
          type: "heading",
          content: "Summoning Objects & People",
        },
        {
          type: "text",
          content:
            "To summon something: expect it to be behind you, around a corner, or in your pocket. Don't try to materialize it from thin air - use dream logic instead!",
        },
        {
          type: "exercise",
          content:
            "✈️ Goal: In your next lucid dream, try to levitate even just 1 inch off the ground. Small wins count!",
        },
      ],
      practiceTask: "Set intention to practice levitation in next lucid dream",
    },
  },
  {
    id: 10,
    title: "Sleep Hygiene for Lucid Dreamers",
    description: "Optimize your sleep for better dream recall",
    duration: "7 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "Quality Sleep = Quality Dreams",
        },
        {
          type: "text",
          content:
            "You can't have great lucid dreams without great sleep. These habits will improve both your sleep quality and dream recall.",
        },
        {
          type: "heading",
          content: "Evening Routine (2-3 hours before bed)",
        },
        {
          type: "bullet",
          content:
            "• No caffeine after 2 PM\n• Dim the lights (helps melatonin)\n• Reduce blue light from screens\n• No heavy meals or alcohol\n• Light stretching or meditation\n• Review your dream journal",
        },
        {
          type: "heading",
          content: "Bedroom Optimization",
        },
        {
          type: "bullet",
          content:
            "• Cool temperature (65-68°F / 18-20°C)\n• Complete darkness (or eye mask)\n• White noise or silence\n• Comfortable bedding\n• Remove distractions (TV, work items)",
        },
        {
          type: "tip",
          content:
            "Keep your dream journal and pen right next to your bed so you can write without fully waking.",
        },
        {
          type: "heading",
          content: "The 3-2-1 Rule",
        },
        {
          type: "bullet",
          content:
            "• 3 hours before bed: Last big meal\n• 2 hours before bed: Finish work/stressful tasks\n• 1 hour before bed: No screens (or use blue light filter)",
        },
        {
          type: "text",
          content:
            "Consistency matters most! Going to bed and waking at the same time (even weekends) stabilizes your REM cycles and improves recall.",
        },
        {
          type: "exercise",
          content:
            "🛏️ Challenge: Implement the 3-2-1 rule for 7 consecutive days and notice the difference in dream recall.",
        },
      ],
      practiceTask: "Follow the 3-2-1 rule for better sleep this week",
    },
  },
  {
    id: 11,
    title: "WILD: Wake Initiated Lucid Dreams",
    description: "Enter lucid dreams directly from waking state",
    duration: "9 min",
    level: 4,
    content: {
      sections: [
        {
          type: "heading",
          content: "The Advanced Technique",
        },
        {
          type: "text",
          content:
            "WILD is when you maintain consciousness while your body falls asleep. It's challenging but creates the most vivid, stable lucid dreams possible.",
        },
        {
          type: "heading",
          content: "The WILD Process",
        },
        {
          type: "bullet",
          content:
            "• Best done with WBTB after 4-6 hours of sleep\n• Lie completely still and comfortable\n• Let your body relax completely\n• Focus on your breath or visualize a scene\n• Notice hypnagogic imagery (dream visuals)\n• Don't move or swallow - stay completely still\n• Wait for sleep paralysis sensations\n• Enter the dream scene you're visualizing",
        },
        {
          type: "tip",
          content:
            "WILD can cause sleep paralysis sensations (vibrations, sounds, heaviness). Don't panic - this is normal and temporary!",
        },
        {
          type: "heading",
          content: "Common Obstacles",
        },
        {
          type: "text",
          content:
            "The itch problem: You'll want to scratch or move. Don't! This resets the process. The sensation will pass in 1-2 minutes.",
        },
        {
          type: "text",
          content:
            "Falling asleep too fast: If you lose consciousness before reaching the dream state, try more mental engagement (counting, visualizing).",
        },
        {
          type: "heading",
          content: "WILD Anchors",
        },
        {
          type: "bullet",
          content:
            "• Count breaths (1-100, repeat)\n• Visualize climbing stairs or descending\n• Listen to ambient sounds\n• Focus on the darkness behind closed eyes\n• Repeat a mantra mentally",
        },
        {
          type: "exercise",
          content:
            "🧘 Practice: Try WILD after a WBTB alarm this weekend. Even failing teaches you about the transition to sleep!",
        },
      ],
      practiceTask: "Attempt WILD technique with WBTB support",
    },
  },
  {
    id: 12,
    title: "Dealing with Nightmares",
    description: "Transform fear into lucidity and control",
    duration: "7 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "Nightmares as Opportunities",
        },
        {
          type: "text",
          content:
            "Nightmares are actually perfect for triggering lucidity because they're emotionally intense. Strong emotions = heightened awareness = easier to realize you're dreaming!",
        },
        {
          type: "heading",
          content: "The Nightmare Reality Check",
        },
        {
          type: "text",
          content:
            "Train yourself: whenever you feel fear or anxiety during the day, do a reality check. This habit will carry into nightmares, triggering lucidity right when you need it most.",
        },
        {
          type: "heading",
          content: "What to Do When Lucid in a Nightmare",
        },
        {
          type: "bullet",
          content:
            "• Remember: Nothing can hurt you\n• Face the threat directly (it often disappears)\n• Transform into something positive\n• Fly away if needed\n• Summon protection or help\n• Turn it into something absurd (make monster wear a tutu)",
        },
        {
          type: "tip",
          content:
            "Confronting nightmare figures often causes them to transform or vanish. They're just projections of your own mind!",
        },
        {
          type: "heading",
          content: "Preventing Nightmares",
        },
        {
          type: "bullet",
          content:
            "• Reduce stress before bed\n• Avoid scary content late at night\n• Process anxiety through journaling\n• Use positive imagery before sleep\n• Practice gratitude or meditation",
        },
        {
          type: "text",
          content:
            "Many lucid dreamers report that nightmares virtually disappear once they've successfully faced them lucidly a few times.",
        },
        {
          type: "exercise",
          content:
            '💪 Affirmation: Before bed tonight, say "If I have a nightmare, I will realize I\'m dreaming and take control."',
        },
      ],
      practiceTask: "Do reality checks whenever you feel fear or anxiety",
    },
  },
  {
    id: 13,
    title: "Dream Characters & Conversations",
    description: "Interact with your subconscious mind",
    duration: "8 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "Who Are Dream Characters?",
        },
        {
          type: "text",
          content:
            "Dream characters are projections of your subconscious mind. They can be surprisingly wise, creative, or insightful - because they ARE you!",
        },
        {
          type: "heading",
          content: "Meaningful Conversations",
        },
        {
          type: "bullet",
          content:
            '• Ask "What do you represent?"\n• Ask "What do I need to know?"\n• Request advice or guidance\n• Ask them to show you something important\n• Listen carefully to their answers',
        },
        {
          type: "text",
          content:
            "Treat dream characters with respect. They may surprise you with profound insights you didn't know you had!",
        },
        {
          type: "heading",
          content: "Finding Specific People",
        },
        {
          type: "text",
          content:
            "To meet someone specific: expect them to be around the next corner, behind a door, or call out their name. Don't force it - use dream logic!",
        },
        {
          type: "tip",
          content:
            "Dream characters may get defensive or hostile if you tell them they're not real. Instead, ask them insightful questions!",
        },
        {
          type: "heading",
          content: "Creative Collaboration",
        },
        {
          type: "text",
          content:
            "Ask dream characters to help you create: write a song, solve a problem, or show you art. Your subconscious is incredibly creative!",
        },
        {
          type: "heading",
          content: "The Mirror Test",
        },
        {
          type: "text",
          content:
            "Advanced: Ask to see a mirror. Your reflection often reveals subconscious insights about how you see yourself. Be prepared - it can be surprising!",
        },
        {
          type: "exercise",
          content:
            '💬 Goal: In your next lucid dream, have a meaningful conversation with a dream character. Ask "What do I need to know?"',
        },
      ],
      practiceTask: "Set intention to talk with dream characters",
    },
  },
  {
    id: 14,
    title: "Dream Incubation",
    description: "Program specific dreams before sleep",
    duration: "6 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "What is Dream Incubation?",
        },
        {
          type: "text",
          content:
            "Dream incubation is the practice of 'programming' your dreams to explore specific topics, visit certain places, or solve problems. It works surprisingly well!",
        },
        {
          type: "heading",
          content: "How to Incubate a Dream",
        },
        {
          type: "bullet",
          content:
            "• Choose your dream topic clearly\n• Write it down as a question or intention\n• Visualize the scenario for 10-15 minutes\n• Repeat your intention as you fall asleep\n• Keep dream journal ready to record results",
        },
        {
          type: "heading",
          content: "Good Incubation Topics",
        },
        {
          type: "bullet",
          content:
            "• Visiting a specific place\n• Meeting a specific person\n• Solving a creative problem\n• Practicing a skill\n• Exploring a question\n• Healing or processing emotions",
        },
        {
          type: "tip",
          content:
            'Frame as questions: "What can I learn about X?" works better than "I want to dream about X"',
        },
        {
          type: "text",
          content:
            "Even if the dream doesn't match exactly, your subconscious often provides metaphorical or symbolic answers to your question.",
        },
        {
          type: "heading",
          content: "Problem-Solving Dreams",
        },
        {
          type: "text",
          content:
            "Many famous discoveries came from dreams! Your sleeping mind can make connections your waking mind misses. Ask it for help!",
        },
        {
          type: "exercise",
          content:
            "📝 Tonight: Write down one clear question or intention before bed. Visualize it for 10 minutes. See what your dreams reveal!",
        },
      ],
      practiceTask: "Write and visualize a dream incubation question",
    },
  },
  {
    id: 15,
    title: "Supplements & Lucid Dreaming",
    description: "Evidence-based supplements that may help",
    duration: "8 min",
    level: 4,
    content: {
      sections: [
        {
          type: "heading",
          content: "A Word of Caution",
        },
        {
          type: "text",
          content:
            "Supplements are NOT necessary for lucid dreaming! Technique and practice are far more important. That said, some supplements may enhance recall or vividness for some people.",
        },
        {
          type: "heading",
          content: "Galantamine (Most Studied)",
        },
        {
          type: "text",
          content:
            "Galantamine (4-8mg with WBTB) is the most researched lucid dreaming supplement. Studies show it can increase lucidity rates. However: it's not suitable for everyone and can cause side effects.",
        },
        {
          type: "heading",
          content: "Vitamin B6",
        },
        {
          type: "text",
          content:
            "B6 (100-250mg before bed) may enhance dream vividness and recall. It's safe and cheap. Worth trying if you have poor dream recall.",
        },
        {
          type: "heading",
          content: "Other Options",
        },
        {
          type: "bullet",
          content:
            "• Alpha-GPC: May enhance clarity\n• Mugwort tea: Traditional dream herb\n• Melatonin: Improves REM sleep\n• L-Theanine: Promotes relaxed awareness\n• Magnesium: Better sleep quality",
        },
        {
          type: "tip",
          content:
            "Start with sleep hygiene and technique first! Supplements should be enhancement, not foundation.",
        },
        {
          type: "heading",
          content: "Important Safety Notes",
        },
        {
          type: "bullet",
          content:
            "• Consult a doctor before trying supplements\n• Start with low doses\n• Don't combine multiple at once\n• Take breaks (not every night)\n• Stop if you experience negative effects\n• Never rely on supplements alone",
        },
        {
          type: "text",
          content:
            "Remember: The best 'supplement' is consistent practice, good sleep, and dream journaling!",
        },
        {
          type: "exercise",
          content:
            "🔬 Research: If interested in supplements, research thoroughly and consult a healthcare provider first.",
        },
      ],
      practiceTask: "Research supplements safely and consult a doctor",
    },
  },
  {
    id: 16,
    title: "Lucid Dream Goals & Exploration",
    description: "What to do once you're lucid",
    duration: "7 min",
    level: 3,
    content: {
      sections: [
        {
          type: "heading",
          content: "Beyond Flying: What's Possible?",
        },
        {
          type: "text",
          content:
            "Many beginners only think of flying or superpowers. But lucid dreams offer so much more: creative exploration, problem-solving, therapy, and spiritual experiences.",
        },
        {
          type: "heading",
          content: "Creative Goals",
        },
        {
          type: "bullet",
          content:
            "• Visit dream art galleries\n• Listen to dream music\n• Write with dream characters\n• Design architecture\n• Experience impossible art",
        },
        {
          type: "heading",
          content: "Personal Growth Goals",
        },
        {
          type: "bullet",
          content:
            "• Face fears and phobias\n• Practice public speaking\n• Have conversations with parts of yourself\n• Process emotions\n• Practice forgiveness\n• Explore past memories",
        },
        {
          type: "heading",
          content: "Adventure Goals",
        },
        {
          type: "bullet",
          content:
            "• Visit alien planets\n• Travel through time\n• Explore the ocean depths\n• Fly through space\n• Meet historical figures\n• Visit fictional worlds",
        },
        {
          type: "tip",
          content:
            'Keep a "Dream Bucket List" in your journal. Having clear goals makes lucid dreams more memorable and meaningful!',
        },
        {
          type: "heading",
          content: "Experimental Goals",
        },
        {
          type: "bullet",
          content:
            '• Ask the dream to show you something important\n• Try to access "higher consciousness"\n• Request to meet your "higher self"\n• Explore the edge of the dream world\n• Experiment with teleportation',
        },
        {
          type: "exercise",
          content:
            "📋 Create your lucid dream bucket list: Write down 10 things you want to try in lucid dreams!",
        },
      ],
      practiceTask: "Write your top 10 lucid dream goals",
    },
  },
  {
    id: 17,
    title: "False Awakenings & Dream Layers",
    description: "Navigate inception-style dream experiences",
    duration: "6 min",
    level: 4,
    content: {
      sections: [
        {
          type: "heading",
          content: "What is a False Awakening?",
        },
        {
          type: "text",
          content:
            "A false awakening is when you dream you've woken up - complete with your bedroom, morning routine, etc. They're common during lucid dream practice!",
        },
        {
          type: "heading",
          content: "Why They Happen",
        },
        {
          type: "text",
          content:
            "Your brain's getting good at maintaining consciousness through sleep transitions. False awakenings are actually a GOOD sign - they mean you're getting closer to consistent lucidity!",
        },
        {
          type: "heading",
          content: "How to Catch Them",
        },
        {
          type: "bullet",
          content:
            "• Do a reality check IMMEDIATELY upon waking\n• Make this an automatic habit every morning\n• Check before you even get out of bed\n• Question whether you actually woke up\n• Look for small inconsistencies",
        },
        {
          type: "tip",
          content:
            'Pro tip: Do 2-3 different reality checks in a row when you "wake up". One might fail in the dream!',
        },
        {
          type: "heading",
          content: "Multiple Layers",
        },
        {
          type: "text",
          content:
            "Sometimes you'll wake from a false awakening into... another false awakening! Don't panic. Reality check at each layer. You'll eventually reach true waking.",
        },
        {
          type: "heading",
          content: "Using False Awakenings",
        },
        {
          type: "text",
          content:
            "Once you catch a false awakening, you're instantly lucid! Use this high-awareness state to stabilize and have amazing lucid dreams.",
        },
        {
          type: "exercise",
          content:
            "✅ Create a habit: Do a reality check EVERY time you wake up for the next 30 days. This will catch false awakenings!",
        },
      ],
      practiceTask: "Reality check immediately upon every waking",
    },
  },
  {
    id: 18,
    title: "Shared Dreaming & Dream Telepathy",
    description: "Explore the controversial frontiers of dreaming",
    duration: "7 min",
    level: 4,
    content: {
      sections: [
        {
          type: "heading",
          content: "Shared Dreams: Real or Wishful Thinking?",
        },
        {
          type: "text",
          content:
            "Many lucid dreamers report attempting to meet others in dreams. While not scientifically proven, the experiences are compelling and worth exploring!",
        },
        {
          type: "heading",
          content: "Attempting Shared Dreams",
        },
        {
          type: "bullet",
          content:
            "• Choose a partner also practicing lucid dreaming\n• Agree on a specific meeting place/time\n• Both incubate the same dream location\n• Compare notes immediately upon waking\n• Look for matching details, not perfect replicas",
        },
        {
          type: "text",
          content:
            "Even if not literally 'shared,' the practice improves your incubation skills and creates meaningful connections.",
        },
        {
          type: "tip",
          content:
            'Start with simple, unique locations: "A red lighthouse on a beach" is better than "the park"',
        },
        {
          type: "heading",
          content: "Dream Telepathy Experiments",
        },
        {
          type: "text",
          content:
            "Some researchers have studied whether people can 'send' images or information to sleepers. Results are mixed but intriguing. Try it yourself!",
        },
        {
          type: "heading",
          content: "Realistic Expectations",
        },
        {
          type: "text",
          content:
            "Most 'matches' are likely coincidence or the power of suggestion. But the exploration itself is valuable for developing your dream skills and connection with others!",
        },
        {
          type: "heading",
          content: "Scientific Perspective",
        },
        {
          type: "text",
          content:
            "Currently, no scientific evidence proves shared dreaming is possible. But that doesn't make the experiences less meaningful or the practice less valuable for skill development!",
        },
        {
          type: "exercise",
          content:
            "🤝 Find a lucid dreaming partner and attempt a shared dream experiment. Record your experiences!",
        },
      ],
      practiceTask: "Attempt a shared dream with a practice partner",
    },
  },
  {
    id: 19,
    title: "Maintaining Long-Term Practice",
    description: "Stay motivated and avoid burnout",
    duration: "6 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "The Long Game",
        },
        {
          type: "text",
          content:
            "Lucid dreaming is a marathon, not a sprint. Most people have dry spells, motivation dips, and plateaus. Here's how to maintain practice long-term.",
        },
        {
          type: "heading",
          content: "Avoiding Burnout",
        },
        {
          type: "bullet",
          content:
            "• Don't obsess - balance is key\n• Take breaks when needed\n• Celebrate small wins\n• Don't judge yourself for 'failures'\n• Remember it's supposed to be fun!",
        },
        {
          type: "heading",
          content: "Dealing with Dry Spells",
        },
        {
          type: "text",
          content:
            "Everyone goes weeks or months without lucid dreams sometimes. This is NORMAL. Your skills aren't gone - they're just hibernating. Back to basics always works.",
        },
        {
          type: "tip",
          content:
            "During dry spells, focus on dream journaling and reality checks. Don't add pressure with advanced techniques.",
        },
        {
          type: "heading",
          content: "Staying Motivated",
        },
        {
          type: "bullet",
          content:
            "• Join online communities\n• Read lucid dream reports for inspiration\n• Set monthly goals (not daily)\n• Track progress in Dream Pilot\n• Remember your 'why' - why did you start?",
        },
        {
          type: "heading",
          content: "Life Changes",
        },
        {
          type: "text",
          content:
            "Stress, schedule changes, or new medications can affect dreams. Be patient with yourself. Your lucid dreaming skills will return when life stabilizes.",
        },
        {
          type: "exercise",
          content:
            "💭 Reflection: Write about why you started lucid dreaming. Keep this somewhere visible for motivation!",
        },
      ],
      practiceTask: "Write about your lucid dreaming motivation",
    },
  },
  {
    id: 20,
    title: "Creating Your Personal Practice",
    description: "Design a routine that works for YOU",
    duration: "8 min",
    level: 2,
    content: {
      sections: [
        {
          type: "heading",
          content: "No One-Size-Fits-All",
        },
        {
          type: "text",
          content:
            "You've learned many techniques. Now it's time to create YOUR personal practice based on what works for your lifestyle and preferences.",
        },
        {
          type: "heading",
          content: "Core vs. Optional Practices",
        },
        {
          type: "text",
          content:
            "Core (do daily): Dream journaling, reality checks, intention setting. Optional (do weekly): WBTB, WILD, specific techniques.",
        },
        {
          type: "heading",
          content: "Morning Routine",
        },
        {
          type: "bullet",
          content:
            "• Write dreams immediately\n• Do reality check upon waking\n• Review previous night's recall\n• Set intention for next night\n• 5-15 minutes total",
        },
        {
          type: "heading",
          content: "Daytime Routine",
        },
        {
          type: "bullet",
          content:
            "• 8-12 reality checks spread throughout day\n• Mindfulness during unusual moments\n• Think about your dream signs\n• 2-3 minutes at a time",
        },
        {
          type: "heading",
          content: "Evening Routine",
        },
        {
          type: "bullet",
          content:
            "• Sleep hygiene practices\n• Review dream journal\n• Set clear intention\n• Visualization (optional)\n• MILD or chosen technique\n• 10-20 minutes total",
        },
        {
          type: "tip",
          content:
            "Start small! Even 5 minutes of journaling + 5 reality checks daily is enough to start seeing results.",
        },
        {
          type: "heading",
          content: "Weekly Experiments",
        },
        {
          type: "text",
          content:
            "Try one advanced technique per week (WILD, WBTB, incubation). This keeps practice fresh without overwhelming yourself.",
        },
        {
          type: "heading",
          content: "Your Commitment",
        },
        {
          type: "text",
          content:
            "What's your sustainable practice? Design a routine you can maintain for months, not days. Write it down and commit to 30 days!",
        },
        {
          type: "exercise",
          content:
            "📅 Create your personal lucid dreaming routine. Write it down and commit to following it for 30 days!",
        },
      ],
      practiceTask: "Design and commit to your 30-day practice routine",
    },
  },
];
