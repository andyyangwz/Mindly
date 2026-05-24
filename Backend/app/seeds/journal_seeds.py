from datetime import datetime

from app.extensions import db
from app.models.journal import Journal


def _entries(user_id):
    return [
        Journal(
            user_id=user_id,
            title="Finally cracked that DP problem",
            content="Spent the entire afternoon wrestling with a dynamic programming problem for my algorithms class. The kind where you stare at the screen for hours and nothing makes sense, then suddenly it just clicks.\n\nThe trick was realizing it's not about solving the whole thing at once — you break it down, find the subproblems, and build up from there. Sounds obvious in hindsight but man, the moment when the solution finally emerged was pure dopamine.\n\nAlso went for a run to celebrate. 5k in 24 minutes — not my best but felt great after sitting all day.",
            emojis=["💻", "🏃"],
            is_favorite=True,
            is_pinned=False,
            ai_enabled=True,
            created_at=datetime(2026, 5, 3, 22, 30),
            updated_at=datetime(2026, 5, 3, 22, 30),
        ),
        Journal(
            user_id=user_id,
            title="Why do social events drain me so much",
            content="Went to a house party tonight with some friends. It was fun for the first hour but by hour two I was completely drained. Ended up sitting on the couch pretending to check my phone just to have an excuse not to talk.\n\nI feel guilty about it because everyone was having a great time and I just wanted to go home. Is this normal? I like my friends, I like going out sometimes, but it takes so much energy.\n\nMaybe I'm just an introvert who needs alone time to recharge. Need to stop feeling bad about leaving early.",
            emojis=["🎉", "😴"],
            is_favorite=False,
            is_pinned=False,
            ai_enabled=False,
            created_at=datetime(2026, 5, 6, 23, 15),
            updated_at=datetime(2026, 5, 7, 10, 0),
        ),
        Journal(
            user_id=user_id,
            title="Group project stress is real",
            content="Our database systems group project is due in 2 weeks and one of our teammates hasn't done anything. We divided the work weeks ago and he keeps saying 'I'll do it this weekend' but nothing ever comes.\n\nHad a tense group chat tonight. Sam finally called him out and now it's awkward. I hate confrontation but I'm also tired of carrying other people's weight.\n\nOn the bright side, my part of the frontend is looking solid. Got the charts rendering with real data from Alex's API. If worst comes to worst, we can redistribute the work and pull it off.",
            emojis=["👥", "😤"],
            is_favorite=False,
            is_pinned=True,
            ai_enabled=True,
            created_at=datetime(2026, 5, 8, 21, 45),
            updated_at=datetime(2026, 5, 8, 21, 45),
        ),
        Journal(
            user_id=user_id,
            title="It's 1 AM and I can't stop thinking",
            content="Lying in bed and my brain won't shut up. Thinking about whether I'm doing enough. Everyone around me seems so sure about what they want — internships, research, grad school. I'm just here trying to pass my classes.\n\nBut then I think: who actually has it figured out at 20? Probably nobody. Social media makes it look like everyone's building startups and publishing papers but real life is mostly just... figuring things out as you go.\n\nI don't know. Maybe I'm overthinking again. Mom always says I inherited her anxiety. Going to put on some rain sounds and try to sleep.",
            emojis=["🌙", "🤔"],
            is_favorite=False,
            is_pinned=True,
            ai_enabled=False,
            created_at=datetime(2026, 5, 10, 1, 12),
            updated_at=datetime(2026, 5, 11, 9, 30),
        ),
        Journal(
            user_id=user_id,
            title="New bench PR today",
            content="85kg for 5 reps. Three months ago I could barely do 60kg. Progress feels slow when you're in it every day but looking back, the difference is huge.\n\nCurrent routine is working well:\n- Push day: bench, OHP, incline, triceps\n- Pull day: deadlifts, rows, pull-ups, biceps\n- Leg day: squats, RDLs, lunges\n- Cardio: 2x week running\n\nDiet is still the weak point. Been tracking macros for two weeks and I'm consistently under on protein. Need to meal prep better.",
            emojis=["💪", "🏋️"],
            is_favorite=True,
            is_pinned=False,
            ai_enabled=True,
            created_at=datetime(2026, 5, 12, 19, 0),
            updated_at=datetime(2026, 5, 12, 19, 0),
        ),
        Journal(
            user_id=user_id,
            title="I think I'm burning out",
            content="Skipped two classes today. Didn't even mean to — I just couldn't get out of bed. Lay there staring at the ceiling for an hour before I finally grabbed my phone and emailed myself out of the morning lecture.\n\nI've been running on caffeine and spite for weeks. Three assignments due, a group project, exam prep, trying to maintain a social life and go to the gym... something had to give.\n\nThe worst part is the guilt. I know I should be studying but my brain just won't cooperate. I keep reading the same paragraph over and over.\n\nGoing to take tomorrow off properly. No guilt, no trying to be productive. Just rest.",
            emojis=["😞", "🛏️"],
            is_favorite=True,
            is_pinned=False,
            ai_enabled=False,
            created_at=datetime(2026, 5, 14, 15, 30),
            updated_at=datetime(2026, 5, 14, 22, 0),
        ),
        Journal(
            user_id=user_id,
            title="That AI talk rewired my brain",
            content="Went to a guest lecture on neural architecture search today and I can't stop thinking about it. The speaker was a researcher from DeepMind and the way he explained how they're using RL to design neural networks was mind-blowing.\n\nIt made me realize how much I actually love this stuff. Sometimes I get so caught up in grades and deadlines that I forget why I chose CS in the first place. Days like today remind me.\n\nAlso talked to the speaker after the talk and he said something that stuck with me: 'The best time to start research is now, not when you feel ready.' I'm going to email Prof. Chen about the research assistant position tomorrow.",
            emojis=["🧠", "🚀"],
            is_favorite=False,
            is_pinned=False,
            ai_enabled=True,
            created_at=datetime(2026, 5, 16, 20, 45),
            updated_at=datetime(2026, 5, 16, 20, 45),
        ),
        Journal(
            user_id=user_id,
            title="What am I even doing with my life",
            content="Scrolling through LinkedIn and everyone from high school has internships at Google, Meta, startups. And I'm here with no internship lined up, no research, just some half-finished side projects.\n\nI know comparison is the thief of joy but it's hard not to feel behind. Applied to like 15 internships and got 3 rejections so far. The rest are ghosting me.\n\nBut then I remind myself that I'm only a sophomore. I have time. And my GPA is solid, I have projects I can show, I'm learning. The path isn't linear.\n\nStill. Some days the imposter syndrome hits hard.",
            emojis=["📱", "😰"],
            is_favorite=False,
            is_pinned=False,
            ai_enabled=False,
            created_at=datetime(2026, 5, 18, 23, 0),
            updated_at=datetime(2026, 5, 19, 8, 0),
        ),
        Journal(
            user_id=user_id,
            title="Everything clicked today",
            content="Had one of those rare days where everything just works.\n\nWoke up at 6:30 naturally (no alarm!), got a solid study session in before class, aced my linear algebra quiz, had a great gym session, and made real progress on the group project frontend.\n\nThe key difference? I planned yesterday evening. Wrote down exactly what I wanted to accomplish today and when. No ambiguity, no 'I'll figure it out in the morning.'\n\nAlso tried a new recipe for dinner — teriyaki chicken with broccoli and rice. Turned out surprisingly good. Maybe I should cook more often.",
            emojis=["✅", "🔥"],
            is_favorite=True,
            is_pinned=False,
            ai_enabled=False,
            created_at=datetime(2026, 5, 20, 21, 15),
            updated_at=datetime(2026, 5, 20, 21, 15),
        ),
        Journal(
            user_id=user_id,
            title="Planning next semester — feeling excited",
            content="Just registered for next semester's classes:\n- Machine Learning (finally!)\n- Computer Vision\n- Software Engineering\n- Technical Writing elective\n- Advanced Algorithms\n\nIt's going to be a heavy workload but I'm genuinely excited. ML and CV are what I want to specialize in. I've been self-studying on and off but having structured courses will force me to go deep.\n\nAlso planning to apply for summer research with Prof. Chen. He works on computer vision for medical imaging which sounds fascinating. Going to draft an email this weekend.\n\nFor the first time in a while, I actually feel like I have direction. Not just surviving the semester but building toward something.",
            emojis=["📚", "🎯"],
            is_favorite=False,
            is_pinned=True,
            ai_enabled=True,
            created_at=datetime(2026, 5, 22, 20, 0),
            updated_at=datetime(2026, 5, 22, 20, 0),
        ),
    ]


def seed_journals(user_id, force=False):
    existing = Journal.query.filter_by(user_id=user_id).count()
    if existing > 0:
        if force:
            Journal.query.filter_by(user_id=user_id).delete()
            db.session.commit()
        else:
            raise RuntimeError(
                f"User {user_id} already has {existing} journal entries. "
                "Use --force to delete existing entries and re-seed."
            )

    entries = _entries(user_id)
    for e in entries:
        db.session.add(e)
    db.session.commit()
    return entries
