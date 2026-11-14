# Three-minute walkthrough script

**0:00-0:20.** “This is Monday Morning CRM. It covers Eastern Counties and Aldermoor side by side, and every number is visibly tagged with the source record that supports it.”

**0:20-1:05.** “For Eastern Counties, the first section separates backed value from unbacked claims. Here is a number: I can click or read its source tag, so we know exactly which deal record supports it. The next section maps decision power by deal: decider, payer, user, and blocker, with their recorded stance. This avoids confusing a champion with the person who controls budget.”

**1:05-1:45.** “The third section is the Monday plan: the top three moves are ranked, have a named owner and due date, and say which deal they advance. The fourth section shows deadlines and stuck work. The fifth makes uncertainty explicit: what is missing, why it matters, and who should answer it. Aldermoor receives the same five answers, so a manager can compare accounts without changing their operating model.”

**1:45-2:20.** “I’ll trace one value now. This backed deal value carries its record ID. The CRM never counts a claim if the source ID or numeric value is missing. Those claims appear below the backed total rather than inflating the forecast.”

**2:20-2:45.** “The app refreshes live signals through a server-only route. It polls after the one-minute API guard, so a new signal such as stopped docks, a public-event deadline, or a stakeholder departure appears without a code edit. The token is an environment variable on the server and never reaches the browser.”

**2:45-3:00.** “Finally, the source badges and explicit unknowns make the dashboard reviewable. The result is a live, honest operating view rather than a polished but unverifiable forecast.”
