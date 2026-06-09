const API = process.env.API_URL || 'http://127.0.0.1:5001/api';

const login = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'rishi',
    password: 'Rishi@123',
    accessCode: 'BPS-TEAM-001'
  })
});

if (!login.ok) {
  throw new Error(`Login failed: ${login.status} ${await login.text()}`);
}

const { token, user } = await login.json();
const accessLogin = await fetch(`${API}/auth/access-code-login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessCode: 'BPS-TEAM-001'
  })
});

if (!accessLogin.ok) {
  throw new Error(`Access code login failed: ${accessLogin.status} ${await accessLogin.text()}`);
}

const events = await fetch(`${API}/events`, {
  headers: { Authorization: `Bearer ${token}` }
});

if (!events.ok) {
  throw new Error(`Events failed: ${events.status} ${await events.text()}`);
}

const eventList = await events.json();
const firstEvent = eventList[0];

if (firstEvent) {
  const pin = await fetch(`${API}/events/${firstEvent._id}/pin`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pinned: true })
  });

  if (!pin.ok) {
    throw new Error(`Pin failed: ${pin.status} ${await pin.text()}`);
  }
}

const dashboard = await fetch(`${API}/dashboard`, {
  headers: { Authorization: `Bearer ${token}` }
});

if (!dashboard.ok) {
  throw new Error(`Dashboard failed: ${dashboard.status} ${await dashboard.text()}`);
}

const dashboardData = await dashboard.json();

const memberLogin = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'team',
    password: 'Team@123',
    accessCode: 'BPS-MEMBER-001'
  })
});

if (!memberLogin.ok) {
  throw new Error(`Member login failed: ${memberLogin.status} ${await memberLogin.text()}`);
}

const { token: memberToken } = await memberLogin.json();
let memberPinBlocked = true;

if (firstEvent) {
  const memberPin = await fetch(`${API}/events/${firstEvent._id}/pin`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ pinned: true })
  });
  memberPinBlocked = memberPin.status === 403;
}

const managerLogin = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'manager',
    password: 'Manager@123',
    accessCode: 'BPS-MANAGER-001'
  })
});

if (!managerLogin.ok) {
  throw new Error(`Manager login failed: ${managerLogin.status} ${await managerLogin.text()}`);
}

const { token: managerToken } = await managerLogin.json();
let expenseReviewed = false;

if (firstEvent) {
  const expense = await fetch(`${API}/expenses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${managerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventId: firstEvent._id,
      title: `Smoke test reimbursement ${Date.now()}`,
      category: 'Food',
      amount: 250,
      spentOn: new Date().toISOString(),
      paymentMode: 'UPI',
      description: 'Smoke test expense claim.'
    })
  });

  if (!expense.ok) {
    throw new Error(`Expense create failed: ${expense.status} ${await expense.text()}`);
  }

  const expenseData = await expense.json();
  const review = await fetch(`${API}/expenses/${expenseData._id}/review`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'Approved', feedback: 'Smoke test approved.' })
  });

  if (!review.ok) {
    throw new Error(`Expense review failed: ${review.status} ${await review.text()}`);
  }
  expenseReviewed = true;
}

console.log(JSON.stringify({
  user: user.username,
  role: user.role,
  accessCodeLogin: true,
  events: eventList.length,
  pinnedEvent: dashboardData.pinnedEvent?.eventName || null,
  memberPinBlocked,
  expenseReviewed
}, null, 2));
