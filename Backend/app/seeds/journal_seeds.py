from datetime import datetime, timezone

from app.extensions import db
from app.models.user import User
from app.models.journal import Journal
from app.models.folder import Folder, JournalFolder

SEED_USER_EMAIL = "andyang561@gmail.com"


def seed_user():
    user = User.query.filter_by(email=SEED_USER_EMAIL).first()
    if user:
        return user
    user = User(
        first_name="Andy",
        last_name="Yang",
        username="andyyang561",
        email=SEED_USER_EMAIL,
        password_hash=None,
        verified_at=datetime.now(timezone.utc),
    )
    db.session.add(user)
    db.session.commit()
    return user


FOLDERS = [
    {"name": "Daily Log", "emoji": "📓"},
    {"name": "University", "emoji": "🎓"},
    {"name": "Projects", "emoji": "💻"},
    {"name": "Personal Growth", "emoji": "🌱"},
]


def seed_folders(user_id):
    folder_map = {}
    for f in FOLDERS:
        folder = Folder.query.filter_by(user_id=user_id, name=f["name"]).first()
        if not folder:
            folder = Folder(user_id=user_id, name=f["name"], emoji=f["emoji"])
            db.session.add(folder)
            db.session.commit()
        folder_map[f["name"]] = folder
    return folder_map


def seed_journals(user_id, folder_map):
    journals_data = [
        {
            "title": "Finally shipped the auth refactor",
            "content": (
                "After three days of wrestling with JWT token rotation and refresh token invalidation logic, it's finally done.\n\n"
                "The biggest headache was the race condition between concurrent API calls when a token was about to expire — "
                "both requests would try to refresh at the same time and the second one would get a stale token. "
                "Fixed it with a simple mutex on the client side, but it took me forever to even reproduce it.\n\n"
                "Things I learned:\n"
                "- Never trust the client's clock for token expiry\n"
                "- Always handle the edge case where two refresh attempts overlap\n"
                "- Write integration tests BEFORE refactoring, not after\n\n"
                "Feels good to have this behind me. The codebase is genuinely cleaner now — removed about 200 lines of dead code. 🚀"
            ),
            "emojis": ["🚀", "✅"],
            "is_pinned": True,
            "is_favorite": False,
            "folder_names": ["Projects"],
            "created_at": datetime(2026, 5, 26, 14, 30, 0),
        },
        {
            "title": "Burned out after the hackathon",
            "content": (
                "I'm so tired. Slept maybe 10 hours total across Friday-Sunday. My brain feels like static.\n\n"
                "The project turned out okay — we built a decent MVP and the judges liked it. "
                "But I keep wondering if the sleep deprivation was worth it for a participation trophy. 😴\n\n"
                "Going to bed at 9pm tonight. No phone. No laptop. Just sleep."
            ),
            "emojis": ["😴"],
            "is_pinned": False,
            "is_favorite": False,
            "folder_names": [],
            "created_at": datetime(2026, 5, 24, 22, 15, 0),
        },
        {
            "title": "Thinking about what I want after graduation",
            "content": (
                "Been lying awake the past few nights wondering if I'm on the right path.\n\n"
                "The tech industry feels so unstable right now. Layoffs everywhere. Everyone says \"just follow your passion\" "
                "but what if your passion is just… building things? Not changing the world, not founding a startup, not becoming a staff engineer at FAANG.\n\n"
                "I sometimes miss when coding was just fun. Before LeetCode. Before system design interviews. Before every project had to be a portfolio piece.\n\n"
                "Maybe the answer is to:\n"
                "- Keep my skills sharp\n"
                "- Work on things I actually care about\n"
                "- Not tie my identity to my job title\n\n"
                "I don't know. Writing this out helps a little. I'll figure it out eventually."
            ),
            "emojis": [],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": ["Personal Growth"],
            "created_at": datetime(2026, 5, 20, 23, 45, 0),
        },
        {
            "title": "Normal Tuesday",
            "content": (
                "Woke up late again. Grabbed coffee from the shop on campus. "
                "Lectures were fine — OS in the morning, Networks after lunch. "
                "Fell asleep during Networks for like 10 minutes. Nobody noticed. Or maybe they did and just didn't say anything.\n\n"
                "Spent the evening working on the databases assignment. "
                "Normal day. Nothing special. Kind of nice actually."
            ),
            "emojis": [],
            "is_pinned": False,
            "is_favorite": False,
            "folder_names": ["Daily Log"],
            "created_at": datetime(2026, 5, 18, 20, 0, 0),
        },
        {
            "title": "Deep work session actually worked",
            "content": (
                "Tried something different today. Put my phone in another room, closed all browser tabs except what I needed, "
                "and did four 25-minute pomodoros with 5-minute breaks.\n\n"
                "Got more done in 2 hours than I usually do in a full afternoon. The key was:\n"
                "- No phone within arm's reach\n"
                "- A specific goal for each pomodoro (not just \"work on project\")\n"
                "- Short enough sessions that I didn't burn out\n\n"
                "Why haven't I been doing this all semester? 🍅🔥\n\n"
                "Going to try making this a daily habit. The hard part is starting the first session — once I'm in, I'm in."
            ),
            "emojis": ["🍅", "🔥"],
            "is_pinned": True,
            "is_favorite": True,
            "folder_names": ["Personal Growth"],
            "created_at": datetime(2026, 5, 22, 16, 0, 0),
        },
        {
            "title": "Fight with roommate",
            "content": (
                "Had a stupid argument with Mike tonight. He left his dishes in the sink for the third day in a row "
                "and I snapped at him. He said I was being controlling. I said he was being inconsiderate. "
                "It escalated from there.\n\n"
                "I hate confrontation. It drains me completely. Now I'm sitting in my room with that heavy chest feeling "
                "and I can't focus on anything.\n\n"
                "We'll probably be fine by tomorrow. We always are. But I wish I handled it better — "
                "could have brought it up calmly instead of letting it build up until I exploded over dishes.\n\n"
                "Note to self: speak up earlier, speak softer."
            ),
            "emojis": [],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": [],
            "created_at": datetime(2026, 5, 15, 22, 30, 0),
        },
        {
            "title": "Grateful for my friends",
            "content": (
                "Today was one of those days where everything reminded me how lucky I am.\n\n"
                "Sarah brought me bubble tea when I was stressed about the assignment. "
                "Alex stayed on a late-night call helping me debug a stupid semaphore issue "
                "even though he had an exam the next morning.\n\n"
                "I don't say thank you enough. Life feels a lot less heavy when you have people who show up for you. ❤️\n\n"
                "Going to be better about showing up for them too."
            ),
            "emojis": ["❤️", "🙏"],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": [],
            "created_at": datetime(2026, 5, 25, 21, 0, 0),
        },
        {
            "title": "Sleep schedule is broken again",
            "content": (
                "It's 3:47 AM and I'm writing this instead of sleeping.\n\n"
                "This keeps happening. I tell myself I'll sleep early, then I end up doomscrolling or "
                "\"just one more episode\" or suddenly feeling motivated to code at midnight.\n\n"
                "Tomorrow (today?) I have a 9 AM lecture. I'm going to be a zombie.\n\n"
                "I should probably delete TikTok."
            ),
            "emojis": [],
            "is_pinned": True,
            "is_favorite": False,
            "folder_names": ["Daily Log"],
            "created_at": datetime(2026, 4, 30, 3, 47, 0),
        },
        {
            "title": "Reading Sapiens — mind blown",
            "content": (
                "Finally got around to reading Yuval Noah Harari's Sapiens and I can't put it down.\n\n"
                "The idea that large-scale human cooperation is fundamentally based on shared fictions — "
                "money, nations, laws, corporations — is simultaneously obvious and earth-shattering. "
                "We built civilization on collective belief.\n\n"
                "Some passages that really stuck with me:\n\n"
                "> \"There are no gods in the universe, no nations, no money, no human rights, no laws, and no justice outside the common imagination of human beings.\"\n\n"
                "It makes me look at everything differently. The apps we build, the companies we work for, "
                "the degrees we chase — it's all stories we agree to believe in together.\n\n"
                "Not in a nihilistic way though. More like… if we can collectively imagine something, "
                "we can collectively reimagine it. That feels empowering somehow. 📖\n\n"
                "Halfway through. Already ordered Homo Deus."
            ),
            "emojis": ["📖"],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": ["Personal Growth"],
            "created_at": datetime(2026, 5, 10, 19, 30, 0),
        },
        {
            "title": "Progress on the side project",
            "content": (
                "Spent the weekend building out the notification system for the habit tracker app. "
                "It's coming together.\n\n"
                "What got done:\n"
                "- Push notification service using Firebase\n"
                "- Custom notification preferences per habit\n"
                "- Daily reminder scheduling\n"
                "- Quiet hours mode\n\n"
                "Hit a weird bug where notifications would fire twice on Android. "
                "Turns out I was registering two separate Firebase instances because of a lazy import cycle. "
                "Spent 3 hours debugging something that was literally one line fix. ⚙️\n\n"
                "The app is actually usable now. Not ready for production but I've been dogfooding it for a week. "
                "There's something special about using something you built yourself."
            ),
            "emojis": ["⚙️"],
            "is_pinned": True,
            "is_favorite": True,
            "folder_names": ["Projects"],
            "created_at": datetime(2026, 5, 5, 17, 0, 0),
        },
        {
            "title": "Imposter syndrome hitting hard",
            "content": (
                "Looked at some of my classmates' projects today and immediately felt like I'm falling behind.\n\n"
                "One guy built a full Kubernetes deployment pipeline. Another shipped a mobile app with 10k+ downloads. "
                "And I'm here proud that I finally figured out how to write a proper SQL join.\n\n"
                "I know comparison is the thief of joy. I know everyone moves at their own pace. "
                "But knowing that intellectually and feeling it emotionally are two very different things.\n\n"
                "The rational part of me says:\n"
                "- I'm learning steadily\n"
                "- I understand fundamentals deeply\n"
                "- I ship working code\n\n"
                "The irrational part says everyone is going to figure out I don't belong here.\n\n"
                "Going to try to use this as motivation instead of letting it paralyze me."
            ),
            "emojis": [],
            "is_pinned": False,
            "is_favorite": False,
            "folder_names": [],
            "created_at": datetime(2026, 4, 28, 21, 15, 0),
        },
        {
            "title": "Great conversation with Prof. Chen",
            "content": (
                "Stayed after class to ask Prof. Chen about research opportunities and ended up talking for almost an hour.\n\n"
                "She told me about her work on distributed systems for IoT networks and it's genuinely fascinating. "
                "The problem of coordinating thousands of resource-constrained devices with intermittent connectivity "
                "is way more complex than I ever imagined.\n\n"
                "She invited me to sit in on her research group meetings. I think I'm actually going to do it. 🎓\n\n"
                "Key takeaways:\n"
                "- Research is mostly failing, but the failures teach you more than successes\n"
                "- The best problems are the ones nobody has solved yet\n"
                "- Don't wait until you feel ready — start before you're ready\n\n"
                "Feeling inspired. This is why I chose this field. 💡"
            ),
            "emojis": ["🎓", "💡"],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": ["University"],
            "created_at": datetime(2026, 4, 22, 15, 0, 0),
        },
        {
            "title": "Weekend hiking trip",
            "content": (
                "Went hiking with the group up to Mount Diablo. Left at 6 AM, got back at 7 PM. "
                "My legs are screaming but my mind is quiet in the best way.\n\n"
                "There's something about being in nature that resets something in my brain. "
                "No notifications. No deadlines. Just trail, trees, and sky.\n\n"
                "We stopped at the summit around noon and you could see the entire bay. "
                "The city felt like a tiny toy model from up there. Perspective, I guess. 🌲⛰️\n\n"
                "We should do this more often. Make it a monthly thing."
            ),
            "emojis": ["🌲", "⛰️"],
            "is_pinned": False,
            "is_favorite": False,
            "folder_names": ["Daily Log"],
            "created_at": datetime(2026, 5, 12, 20, 0, 0),
        },
        {
            "title": "Habit tracker progress — 2 week streak!",
            "content": (
                "Hit the 14-day mark on both meditation and reading habits today. Never thought I'd actually stick with them.\n\n"
                "Meditation: 10 minutes every morning. Some days it feels transformative, "
                "most days it feels like sitting still doing nothing. But I'm showing up.\n\n"
                "Reading: 20 pages before bed instead of phone scrolling. Finished two books already this month.\n\n"
                "The key was making it so easy I couldn't say no:\n"
                "- Meditation mat stays out on the floor\n"
                "- Book stays on my nightstand\n"
                "- Phone charger stays in the living room\n\n"
                "Small systems beat big willpower every time."
            ),
            "emojis": [],
            "is_pinned": True,
            "is_favorite": False,
            "folder_names": ["Personal Growth"],
            "created_at": datetime(2026, 5, 8, 8, 30, 0),
        },
        {
            "title": "AI feels like it's changing everything",
            "content": (
                "Been thinking a lot about AI and what it means for the kind of work I want to do.\n\n"
                "I used AI to help debug a tricky race condition today and it solved it in 30 seconds — "
                "something that would have taken me hours to trace through. It's an incredible tool.\n\n"
                "But it also makes me wonder:\n\n"
                "1. What happens to junior developers if AI can do 80% of what an entry-level engineer does?\n"
                "2. How do you build deep expertise if you always reach for AI instead of struggling through the problem yourself?\n"
                "3. Will the nature of software engineering shift from \"writing code\" to \"curating AI output\"?\n\n"
                "I don't think AI will replace engineers entirely. But I think the engineers who use AI effectively "
                "will replace those who don't.\n\n"
                "The plan:\n"
                "- Use AI as a force multiplier, not a crutch\n"
                "- Still learn fundamentals deeply\n"
                "- Focus on problems that require human judgment\n\n"
                "It's an exciting time to be in this field. Also a terrifying one. Maybe both can be true."
            ),
            "emojis": [],
            "is_pinned": False,
            "is_favorite": True,
            "folder_names": [],
            "created_at": datetime(2026, 4, 15, 20, 45, 0),
        },
    ]

    created = 0
    for jd in journals_data:
        folder_names = jd.pop("folder_names")
        journal = Journal(
            user_id=user_id,
            title=jd["title"],
            content=jd["content"],
            emojis=jd["emojis"],
            is_favorite=jd["is_favorite"],
            is_pinned=jd["is_pinned"],
            created_at=jd["created_at"],
            updated_at=jd["created_at"],
        )
        db.session.add(journal)
        db.session.flush()

        for fname in folder_names:
            folder = folder_map.get(fname)
            if folder:
                db.session.add(JournalFolder(journal_id=journal.id, folder_id=folder.id))
        created += 1

    db.session.commit()
    return created


def seed_journals_all():
    user = seed_user()
    folder_map = seed_folders(user.id)
    count = seed_journals(user.id, folder_map)
    return user, count


def run():
    from app import create_app
    app = create_app()
    with app.app_context():
        user, count = seed_journals_all()
        print(f"Seeded {count} journals for {user.email}")


if __name__ == "__main__":
    run()
