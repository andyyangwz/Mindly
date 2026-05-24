import uuid
from datetime import date, time, datetime

from app.extensions import db
from app.models.productivity import ProductivityEvent

CURRENT = date(2026, 5, 24)

C = {
    "purple": "#7C3AED",
    "blue": "#3B82F6",
    "green": "#10B981",
    "amber": "#F59E0B",
    "orange": "#F97316",
    "red": "#EF4444",
    "pink": "#EC4899",
    "teal": "#14B8A6",
}

TASK_GROUPS = {
    "database_project": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    "ml_homework": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
    "stats_report": uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    "ui_redesign": uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"),
    "research_outline": uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
    "group_presentation": uuid.UUID("11111111-1111-1111-1111-111111111111"),
    "calculus_set": uuid.UUID("22222222-2222-2222-2222-222222222222"),
    "api_integration": uuid.UUID("33333333-3333-3333-3333-333333333333"),
    "lit_review": uuid.UUID("44444444-4444-4444-4444-444444444444"),
    "capstone_proposal": uuid.UUID("55555555-5555-5555-5555-555555555555"),
    "reading_response": uuid.UUID("66666666-6666-6666-6666-666666666666"),
    "coding_challenge": uuid.UUID("77777777-7777-7777-7777-777777777777"),
    "lab_report": uuid.UUID("88888888-8888-8888-8888-888888888888"),
    "job_application": uuid.UUID("99999999-9999-9999-9999-999999999999"),
    "study_notes": uuid.UUID("aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    "budget_app": uuid.UUID("aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
}


def _status_change_at(status, event_date):
    if status in ("Done", "In Progress"):
        return datetime.combine(event_date, time(12, 0))
    return None


def _activity_status(event_date):
    if event_date < CURRENT:
        return "Done"
    if event_date in (CURRENT, date(2026, 5, 25)):
        return "In Progress"
    return "To Do"


def _task_status(start_date, deadline_date):
    if deadline_date < CURRENT:
        return "Done"
    if start_date <= CURRENT:
        return "In Progress"
    return "To Do"


def _entries(user_id):
    events = []

    def activity(title, desc, d, s, e, color, priority, level):
        st = _activity_status(d)
        events.append(ProductivityEvent(
            user_id=user_id,
            title=title,
            description=desc,
            event_date=d,
            start_time=s,
            end_time=e,
            color=color,
            priority=priority,
            productivity_level=level,
            has_deadline=False,
            is_deadline_marker=False,
            task_group_id=None,
            status=st,
            status_change_at=_status_change_at(st, d),
        ))

    def task_start(title, desc, d, s, e, color, priority, level,
                   deadline_date, deadline_time, task_group_id):
        st = _task_status(d, deadline_date)
        events.append(ProductivityEvent(
            user_id=user_id,
            title=title,
            description=desc,
            event_date=d,
            start_time=s,
            end_time=e,
            color=color,
            priority=priority,
            productivity_level=level,
            has_deadline=True,
            is_deadline_marker=False,
            task_group_id=task_group_id,
            deadline_date=deadline_date,
            deadline_time=deadline_time,
            status=st,
            status_change_at=_status_change_at(st, d),
        ))

    def task_deadline(title, start_date, deadline_date, deadline_time, color, priority, level, task_group_id):
        st = _task_status(start_date, deadline_date)
        events.append(ProductivityEvent(
            user_id=user_id,
            title=f"{title} Deadline",
            description="",
            event_date=deadline_date,
            start_time=deadline_time,
            end_time=deadline_time,
            color=color,
            priority=priority,
            productivity_level=level,
            has_deadline=True,
            is_deadline_marker=True,
            task_group_id=task_group_id,
            deadline_date=deadline_date,
            deadline_time=deadline_time,
            status=st,
            status_change_at=_status_change_at(st, deadline_date),
        ))

    # ========================================================================
    # TASKS (16 tasks = 32 records)
    # ========================================================================

    # 1. Database Project — deadline 24 May (In Progress)
    task_start("Database Project",
               "Building the relational schema and writing queries for the final submission.",
               date(2026, 5, 18), time(9, 0), time(11, 0),
               C["purple"], "high", "productive",
               date(2026, 5, 24), time(23, 59), TASK_GROUPS["database_project"])
    task_deadline("Database Project",
                  date(2026, 5, 18), date(2026, 5, 24), time(23, 59),
                  C["purple"], "high", "productive", TASK_GROUPS["database_project"])

    # 2. ML Homework — deadline 22 May (Done)
    task_start("ML Homework",
               "Implementing gradient descent from scratch and running experiments.",
               date(2026, 5, 19), time(13, 0), time(15, 0),
               C["green"], "high", "productive",
               date(2026, 5, 22), time(23, 59), TASK_GROUPS["ml_homework"])
    task_deadline("ML Homework",
                  date(2026, 5, 19), date(2026, 5, 22), time(23, 59),
                  C["green"], "high", "productive", TASK_GROUPS["ml_homework"])

    # 3. Statistics Report — deadline 28 May (In Progress)
    task_start("Statistics Report",
               "Analyzing survey data using SPSS and writing up methodology section.",
               date(2026, 5, 21), time(14, 0), time(16, 0),
               C["orange"], "medium", "obligation",
               date(2026, 5, 28), time(23, 59), TASK_GROUPS["stats_report"])
    task_deadline("Statistics Report",
                  date(2026, 5, 21), date(2026, 5, 28), time(23, 59),
                  C["orange"], "medium", "obligation", TASK_GROUPS["stats_report"])

    # 4. UI Redesign Mockup — deadline 30 May (In Progress)
    task_start("UI Redesign Mockup",
               "Redesigning the dashboard layout in Figma based on user feedback.",
               date(2026, 5, 22), time(10, 0), time(12, 0),
               C["blue"], "medium", "neutral",
               date(2026, 5, 30), time(23, 59), TASK_GROUPS["ui_redesign"])
    task_deadline("UI Redesign Mockup",
                  date(2026, 5, 22), date(2026, 5, 30), time(23, 59),
                  C["blue"], "medium", "neutral", TASK_GROUPS["ui_redesign"])

    # 5. Research Paper Outline — deadline 20 May (Done)
    task_start("Research Paper Outline",
               "Structuring the literature review and methodology sections.",
               date(2026, 5, 18), time(14, 0), time(15, 30),
               C["orange"], "medium", "obligation",
               date(2026, 5, 20), time(23, 59), TASK_GROUPS["research_outline"])
    task_deadline("Research Paper Outline",
                  date(2026, 5, 18), date(2026, 5, 20), time(23, 59),
                  C["orange"], "medium", "obligation", TASK_GROUPS["research_outline"])

    # 6. Group Presentation — deadline 26 May (In Progress)
    task_start("Group Presentation",
               "Compiling slides for the capstone presentation — waiting on teammates.",
               date(2026, 5, 20), time(15, 0), time(16, 30),
               C["amber"], "high", "obligation",
               date(2026, 5, 26), time(23, 59), TASK_GROUPS["group_presentation"])
    task_deadline("Group Presentation",
                  date(2026, 5, 20), date(2026, 5, 26), time(23, 59),
                  C["amber"], "high", "obligation", TASK_GROUPS["group_presentation"])

    # 7. Calculus Problem Set — deadline 19 May (Done)
    task_start("Calculus Problem Set",
               "Integrals and series convergence problems — took forever.",
               date(2026, 5, 18), time(16, 0), time(17, 30),
               C["orange"], "medium", "obligation",
               date(2026, 5, 19), time(23, 59), TASK_GROUPS["calculus_set"])
    task_deadline("Calculus Problem Set",
                  date(2026, 5, 18), date(2026, 5, 19), time(23, 59),
                  C["orange"], "medium", "obligation", TASK_GROUPS["calculus_set"])

    # 8. API Integration Task — deadline 31 May (To Do)
    task_start("API Integration Task",
               "Connecting the frontend to the new REST endpoints.",
               date(2026, 5, 26), time(10, 0), time(12, 0),
               C["purple"], "high", "productive",
               date(2026, 5, 31), time(23, 59), TASK_GROUPS["api_integration"])
    task_deadline("API Integration Task",
                  date(2026, 5, 26), date(2026, 5, 31), time(23, 59),
                  C["purple"], "high", "productive", TASK_GROUPS["api_integration"])

    # 9. Literature Review — deadline 25 May (In Progress)
    task_start("Literature Review",
               "Reading and summarizing 5 papers for the research methods class.",
               date(2026, 5, 22), time(13, 0), time(14, 30),
               C["blue"], "low", "neutral",
               date(2026, 5, 25), time(23, 59), TASK_GROUPS["lit_review"])
    task_deadline("Literature Review",
                  date(2026, 5, 22), date(2026, 5, 25), time(23, 59),
                  C["blue"], "low", "neutral", TASK_GROUPS["lit_review"])

    # 10. Capstone Proposal — deadline 29 May (In Progress)
    task_start("Capstone Proposal",
               "Drafting the project scope, timeline, and expected outcomes.",
               date(2026, 5, 19), time(15, 0), time(17, 0),
               C["purple"], "high", "productive",
               date(2026, 5, 29), time(23, 59), TASK_GROUPS["capstone_proposal"])
    task_deadline("Capstone Proposal",
                  date(2026, 5, 19), date(2026, 5, 29), time(23, 59),
                  C["purple"], "high", "productive", TASK_GROUPS["capstone_proposal"])

    # 11. Reading Response — deadline 21 May (Done)
    task_start("Reading Response",
               "Weekly critical response to the assigned philosophy text.",
               date(2026, 5, 18), time(11, 0), time(12, 0),
               C["blue"], "low", "neutral",
               date(2026, 5, 21), time(23, 59), TASK_GROUPS["reading_response"])
    task_deadline("Reading Response",
                  date(2026, 5, 18), date(2026, 5, 21), time(23, 59),
                  C["blue"], "low", "neutral", TASK_GROUPS["reading_response"])

    # 12. Coding Challenge — deadline 27 May (In Progress)
    task_start("Coding Challenge",
               "Weekly LeetCode-style problem set for the algorithms club.",
               date(2026, 5, 23), time(15, 0), time(17, 0),
               C["green"], "medium", "productive",
               date(2026, 5, 27), time(23, 59), TASK_GROUPS["coding_challenge"])
    task_deadline("Coding Challenge",
                  date(2026, 5, 23), date(2026, 5, 27), time(23, 59),
                  C["green"], "medium", "productive", TASK_GROUPS["coding_challenge"])

    # 13. Lab Report — deadline 23 May (Done)
    task_start("Lab Report",
               "Writing up the chemistry experiment results and discussion.",
               date(2026, 5, 18), time(10, 0), time(12, 0),
               C["orange"], "medium", "obligation",
               date(2026, 5, 23), time(23, 59), TASK_GROUPS["lab_report"])
    task_deadline("Lab Report",
                  date(2026, 5, 18), date(2026, 5, 23), time(23, 59),
                  C["orange"], "medium", "obligation", TASK_GROUPS["lab_report"])

    # 14. Job Application — deadline 30 May (In Progress)
    task_start("Job Application",
               "Tailoring resume and writing cover letter for the internship posting.",
               date(2026, 5, 25), time(17, 0), time(18, 30),
               C["green"], "high", "productive",
               date(2026, 5, 30), time(23, 59), TASK_GROUPS["job_application"])
    task_deadline("Job Application",
                  date(2026, 5, 25), date(2026, 5, 30), time(23, 59),
                  C["green"], "high", "productive", TASK_GROUPS["job_application"])

    # 15. Study Notes Compilation — deadline 24 May (In Progress)
    task_start("Study Notes Compilation",
               "Organizing all semester notes into a single revision document for finals.",
               date(2026, 5, 22), time(14, 0), time(16, 0),
               C["teal"], "medium", "neutral",
               date(2026, 5, 24), time(23, 59), TASK_GROUPS["study_notes"])
    task_deadline("Study Notes Compilation",
                  date(2026, 5, 22), date(2026, 5, 24), time(23, 59),
                  C["teal"], "medium", "neutral", TASK_GROUPS["study_notes"])

    # 16. Budget Tracker App — deadline 2 Jun (To Do)
    task_start("Budget Tracker App",
               "Building a personal finance tracker as a side project.",
               date(2026, 5, 28), time(15, 0), time(16, 30),
               C["teal"], "low", "neutral",
               date(2026, 6, 2), time(23, 59), TASK_GROUPS["budget_app"])
    task_deadline("Budget Tracker App",
                  date(2026, 5, 28), date(2026, 6, 2), time(23, 59),
                  C["teal"], "low", "neutral", TASK_GROUPS["budget_app"])

    # ========================================================================
    # ACTIVITIES (68 records)
    # ========================================================================

    # --- May 18 (Monday) — 6 activities ---
    activity("Morning Coffee & Planning",
             "Sat down with a coffee to plan out the week. Actually felt productive.",
             date(2026, 5, 18), time(7, 0), time(7, 30),
             C["blue"], "low", "neutral")

    activity("Data Structures Lecture",
             "Covered AVL trees and rotations. Need to review this later.",
             date(2026, 5, 18), time(11, 0), time(12, 30),
             C["orange"], "medium", "obligation")

    activity("Lunch with Friends",
             "Debated whether pineapple belongs on pizza. It does.",
             date(2026, 5, 18), time(12, 30), time(13, 30),
             C["teal"], "low", "neutral")

    activity("Gym Session — Push Day",
             "Chest, shoulders, triceps. Felt strong today.",
             date(2026, 5, 18), time(17, 0), time(18, 0),
             C["green"], "medium", "productive")

    activity("YouTube Spiral — 'Just 5 Minutes'",
             "Clicked on a recommended video. Woke up 90 minutes later.",
             date(2026, 5, 18), time(21, 0), time(22, 30),
             C["red"], "low", "unproductive")

    activity("Late Night Discord Call",
             "Caught up with friends. Talked about nothing important.",
             date(2026, 5, 18), time(22, 30), time(23, 30),
             C["purple"], "low", "neutral")

    # --- May 19 (Tuesday) — 5 activities ---
    activity("Machine Learning Lecture",
             "Neural network backpropagation. My brain hurts.",
             date(2026, 5, 19), time(10, 0), time(11, 30),
             C["orange"], "high", "obligation")

    activity("Coffee Shop Study Session",
             "Went to the local café to study. Got maybe 40% done.",
             date(2026, 5, 19), time(14, 0), time(16, 0),
             C["blue"], "medium", "neutral")

    activity("Gym — Upper Body",
             "Pull-ups, rows, and bench press. Solid session.",
             date(2026, 5, 19), time(17, 30), time(18, 30),
             C["green"], "medium", "productive")

    activity("Doomscrolling Before Bed",
             "Opened Twitter. Big mistake.",
             date(2026, 5, 19), time(22, 0), time(23, 0),
             C["red"], "low", "unproductive")

    activity("Late Night Reading",
             "Actually reading a non-academic book for once.",
             date(2026, 5, 19), time(23, 0), time(23, 30),
             C["teal"], "low", "productive")

    # --- May 20 (Wednesday) — 5 activities ---
    activity("Algorithms Lecture",
             "Dynamic programming — memoization vs tabulation.",
             date(2026, 5, 20), time(9, 0), time(10, 30),
             C["orange"], "high", "obligation")

    activity("Lunch + Doomscrolling",
             "Ate alone while scrolling. Not proud of it.",
             date(2026, 5, 20), time(12, 30), time(13, 30),
             C["red"], "low", "unproductive")

    activity("Afternoon Nap",
             "Lay down for 20 minutes. Woke up an hour later.",
             date(2026, 5, 20), time(17, 0), time(18, 0),
             C["blue"], "low", "neutral")

    activity("Evening Walk — Brainstorming",
             "Walked around campus thinking about capstone ideas.",
             date(2026, 5, 20), time(19, 0), time(20, 0),
             C["teal"], "medium", "neutral")

    activity("Watching Michael Jackson Live Performance",
             "Found the Bucharest 92 concert. Couldn't stop watching.",
             date(2026, 5, 20), time(21, 0), time(23, 0),
             C["pink"], "low", "unproductive")

    # --- May 21 (Thursday) — 5 activities ---
    activity("Chemistry Lab Session",
             "Titration experiment. Got consistent results for once.",
             date(2026, 5, 21), time(9, 0), time(11, 0),
             C["orange"], "medium", "obligation")

    activity("Quick Lunch",
             "Grabbed a sandwich between classes.",
             date(2026, 5, 21), time(12, 0), time(12, 30),
             C["teal"], "low", "neutral")

    activity("Existential Crisis Walk #1",
             "Walked around the lake questioning all life choices.",
             date(2026, 5, 21), time(16, 30), time(17, 30),
             C["red"], "low", "unproductive")

    activity("Gym Session — Leg Day",
             "Squats, deadlifts, lunges. Could barely walk after.",
             date(2026, 5, 21), time(18, 0), time(19, 0),
             C["green"], "medium", "productive")

    activity("Accidentally Watched Michael Jackson Edits for 2 Hours",
             "Went on YouTube to look up a song. Algorithm took over.",
             date(2026, 5, 21), time(22, 0), time(0, 0),
             C["pink"], "low", "unproductive")

    # --- May 22 (Friday) — 4 activities ---
    activity("Pretending to Study at Café",
             "Sat at a café with a textbook open. Scrolled phone most of the time.",
             date(2026, 5, 22), time(10, 0), time(12, 0),
             C["blue"], "low", "neutral")

    activity("Gym Session",
             "Light cardio and core work. Felt more like a warm-up.",
             date(2026, 5, 22), time(15, 0), time(16, 0),
             C["green"], "medium", "productive")

    activity("Late Night Coding Session",
             "Got into a flow state working on side project. Lost track of time.",
             date(2026, 5, 22), time(20, 0), time(22, 0),
             C["purple"], "high", "productive")

    activity("Night Out with Friends",
             "Grabbed drinks and played pool. Good vibes.",
             date(2026, 5, 22), time(22, 30), time(1, 0),
             C["teal"], "low", "neutral")

    # --- May 23 (Saturday) — 5 activities ---
    activity("Slept In Until 11",
             "Weekend mode. No regrets.",
             date(2026, 5, 23), time(11, 0), time(11, 30),
             C["blue"], "low", "neutral")

    activity("Cleaned Room While Listening to Podcasts",
             "Productive procrastination at its finest.",
             date(2026, 5, 23), time(13, 0), time(14, 30),
             C["teal"], "low", "neutral")

    activity("Afternoon Anime Binge",
             "Caught up on the latest episode. Then started a new series.",
             date(2026, 5, 23), time(15, 0), time(18, 0),
             C["pink"], "low", "unproductive")

    activity("Evening Walk — Fresh Air",
             "Tried to be outside. It was nice.",
             date(2026, 5, 23), time(18, 30), time(19, 30),
             C["green"], "low", "productive")

    activity("Late Night Gaming with Friends",
             "Valorant queue with the squad. Lost more than we won.",
             date(2026, 5, 23), time(22, 0), time(1, 0),
             C["red"], "low", "unproductive")

    # --- May 24 (Sunday — Current Date) — 6 activities ---
    activity("Late Wake Up + Breakfast",
             "Slow start. Made proper eggs for once.",
             date(2026, 5, 24), time(10, 0), time(10, 30),
             C["blue"], "low", "neutral")

    activity("Deep Work Session",
             "Locked in and got real work done. No distractions.",
             date(2026, 5, 24), time(11, 0), time(13, 0),
             C["green"], "high", "productive")

    activity("Quick Lunch",
             "Leftover pasta. Efficient.",
             date(2026, 5, 24), time(13, 0), time(13, 30),
             C["teal"], "low", "neutral")

    activity("Existential Crisis Walk #2",
             "Round two. Same lake, different thoughts.",
             date(2026, 5, 24), time(16, 0), time(17, 0),
             C["red"], "low", "unproductive")

    activity("Journaling",
             "Wrote about the week. Helps clear the mind.",
             date(2026, 5, 24), time(17, 30), time(18, 0),
             C["purple"], "low", "neutral")

    activity("Late Night Anxiety Spiral About Grades",
             "Overthinking every assignment this semester.",
             date(2026, 5, 24), time(23, 0), time(0, 0),
             C["red"], "low", "unproductive")

    # --- May 25 (Monday) — 5 activities ---
    activity("Morning Lecture",
             "Philosophy of mind. Actually engaging today.",
             date(2026, 5, 25), time(10, 0), time(11, 30),
             C["orange"], "medium", "obligation")

    activity("Group Presentation Rehearsal",
             "Ran through slides with the team. Two members didn't show.",
             date(2026, 5, 25), time(14, 0), time(15, 30),
             C["amber"], "high", "obligation")

    activity("Job Application Prep",
             "Rewrote bullet points for the internship. Made it sound impressive.",
             date(2026, 5, 25), time(17, 0), time(18, 30),
             C["green"], "high", "productive")

    activity("Gym — Upper Body",
             "Bench press PR attempt. Didn't get it but close.",
             date(2026, 5, 25), time(19, 0), time(20, 0),
             C["green"], "medium", "productive")

    activity("Relaxing with Music",
             "Listened to some lo-fi and decompressed.",
             date(2026, 5, 25), time(21, 0), time(22, 0),
             C["purple"], "low", "neutral")

    # --- May 26 (Tuesday) — 5 activities ---
    activity("Morning Run",
             "Woke up early and went for a run. Starting the day right.",
             date(2026, 5, 26), time(7, 0), time(7, 30),
             C["green"], "low", "productive")

    activity("Statistics Analysis — SPSS",
             "Running regressions and interpreting output. Tedious but necessary.",
             date(2026, 5, 26), time(10, 0), time(12, 0),
             C["orange"], "high", "obligation")

    activity("Lunch Break",
             "Ate while watching a tech talk.",
             date(2026, 5, 26), time(12, 0), time(12, 30),
             C["teal"], "low", "neutral")

    activity("Fixed Bug That Was Just a Typo",
             "Spent 2 hours debugging. It was a missing semicolon.",
             date(2026, 5, 26), time(15, 0), time(16, 30),
             C["purple"], "medium", "productive")

    activity("Late Night Gaming",
             "Wind-down with some single-player RPG.",
             date(2026, 5, 26), time(22, 0), time(0, 0),
             C["red"], "low", "unproductive")

    # --- May 27 (Wednesday) — 5 activities ---
    activity("9 AM Lecture",
             "Web development. Learning about REST APIs finally clicking.",
             date(2026, 5, 27), time(9, 0), time(10, 30),
             C["orange"], "high", "obligation")

    activity("Coffee with Classmates",
             "Discussed the upcoming group project. Still no concrete plan.",
             date(2026, 5, 27), time(11, 0), time(12, 0),
             C["blue"], "low", "neutral")

    activity("Opened YouTube for 5 Minutes — Disappeared for 2 Hours",
             "Wanted to check one tutorial. Ended up watching cooking videos.",
             date(2026, 5, 27), time(14, 0), time(16, 0),
             C["red"], "low", "unproductive")

    activity("Gym — Leg Day",
             "Squats, Romanian deadlifts, calf raises. Exhausted.",
             date(2026, 5, 27), time(17, 30), time(18, 30),
             C["green"], "medium", "productive")

    activity("Deep Work — Capstone Research",
             "Reading papers and synthesizing findings. Making actual progress.",
             date(2026, 5, 27), time(20, 0), time(22, 0),
             C["purple"], "high", "productive")

    # --- May 28 (Thursday) — 5 activities ---
    activity("Statistics Report Writing Session",
             "Methodology section done. Results section in progress.",
             date(2026, 5, 28), time(9, 0), time(12, 0),
             C["orange"], "high", "obligation")

    activity("Lunch Break",
             "Quick sandwich. Back to work.",
             date(2026, 5, 28), time(12, 0), time(12, 30),
             C["teal"], "low", "neutral")

    activity("Reading for Pleasure",
             "Finally getting through that novel I started last month.",
             date(2026, 5, 28), time(16, 0), time(17, 0),
             C["green"], "low", "productive")

    activity("Evening Walk",
             "Sunset walk around campus. Peaceful.",
             date(2026, 5, 28), time(17, 30), time(18, 30),
             C["blue"], "low", "neutral")

    activity("Movie Night",
             "Watched a Studio Ghibli film. Emotional damage.",
             date(2026, 5, 28), time(20, 0), time(22, 30),
             C["pink"], "low", "unproductive")

    # --- May 29 (Friday) — 4 activities ---
    activity("Morning Productivity Burst",
             "Woke up early and crushed the to-do list. Felt unstoppable.",
             date(2026, 5, 29), time(8, 0), time(10, 0),
             C["green"], "high", "productive")

    activity("Lunch with Friends",
             "Celebrated making it through the week.",
             date(2026, 5, 29), time(12, 0), time(13, 0),
             C["teal"], "low", "neutral")

    activity("Group Project — Nobody Replied",
             "Sent messages in the group chat. Left on read.",
             date(2026, 5, 29), time(14, 0), time(15, 0),
             C["red"], "low", "unproductive")

    activity("Relaxing Evening",
             "Put on some music and did nothing. Needed this.",
             date(2026, 5, 29), time(19, 0), time(21, 0),
             C["purple"], "low", "neutral")

    # --- May 30 (Saturday) — 4 activities ---
    activity("Late Breakfast",
             "Brunch at noon. The weekend way.",
             date(2026, 5, 30), time(10, 0), time(10, 30),
             C["blue"], "low", "neutral")

    activity("Afternoon Gaming Marathon",
             "Lost track of time playing strategy games. Worth it.",
             date(2026, 5, 30), time(13, 0), time(16, 0),
             C["red"], "low", "unproductive")

    activity("Evening Run",
             "Tried to offset the gaming session. Felt good after.",
             date(2026, 5, 30), time(17, 0), time(18, 0),
             C["green"], "medium", "productive")

    activity("Movie with Friends",
             "Watched a thriller. Guessed the twist halfway through.",
             date(2026, 5, 30), time(19, 0), time(22, 0),
             C["teal"], "low", "neutral")

    # --- May 31 (Sunday) — 4 activities ---
    activity("Morning Coding Session",
             "Working on the budgeting app. UI is coming together nicely.",
             date(2026, 5, 31), time(10, 0), time(12, 0),
             C["purple"], "medium", "productive")

    activity("Lunch",
             "Home-cooked meal. Trying to eat better.",
             date(2026, 5, 31), time(12, 0), time(12, 30),
             C["teal"], "low", "neutral")

    activity("Afternoon Reading & Relaxing",
             "Lazy Sunday afternoon. Read and napped alternately.",
             date(2026, 5, 31), time(15, 0), time(17, 0),
             C["blue"], "low", "neutral")

    activity("Evening Music Practice",
             "Played guitar for an hour. Rusty but improving.",
             date(2026, 5, 31), time(18, 0), time(19, 0),
             C["green"], "low", "productive")

    return events


def seed_productivity(user_id, force=False):
    existing = ProductivityEvent.query.filter_by(user_id=user_id).count()
    if existing > 0:
        if force:
            ProductivityEvent.query.filter_by(user_id=user_id).delete()
            db.session.commit()
        else:
            raise RuntimeError(
                f"User {user_id} already has {existing} productivity events. "
                "Use --force to delete existing entries and re-seed."
            )

    entries = _entries(user_id)
    for e in entries:
        db.session.add(e)
    db.session.commit()

    task_count = sum(1 for e in entries if e.task_group_id is not None)
    start_records = sum(1 for e in entries if e.task_group_id is not None and not e.is_deadline_marker)
    deadline_records = sum(1 for e in entries if e.is_deadline_marker)
    activity_count = sum(1 for e in entries if not e.has_deadline)
    groups = len(set(e.task_group_id for e in entries if e.task_group_id))

    print(f"  Seeded {len(entries)} productivity records:")
    print(f"    - {activity_count} activities (single-day events)")
    print(f"    - {groups} task groups ({start_records} start + {deadline_records} deadline = {task_count} task records)")
    print(f"    - Date range: {entries[0].event_date} to {entries[-1].event_date}")
    return entries
