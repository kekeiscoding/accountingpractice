(() => {
  const accounts = {
    Cash: { no: "101", normal: "debit" },
    "Accounts Receivable": { no: "102", normal: "debit" },
    "Office Supplies": { no: "103", normal: "debit" },
    Equipment: { no: "104", normal: "debit" },
    "Accounts Payable": { no: "201", normal: "credit" },
    "Owner's Capital": { no: "301", normal: "credit" },
    "Owner's Drawing": { no: "302", normal: "debit" },
    "Service Revenue": { no: "401", normal: "credit" },
    "Salaries Expense": { no: "501", normal: "debit" },
    "Rent Expense": { no: "502", normal: "debit" },
    "Utilities Expense": { no: "503", normal: "debit" },
    "Supplies Expense": { no: "504", normal: "debit" }
  };
  const stages = ["General Journal", "General Ledger", "Trial Balance", "Income Statement", "Changes in Equity", "Balance Sheet"];
  const $ = (id) => document.getElementById(id);
  let state = null;

  const money = (n) => Math.round(n).toLocaleString("en-PH");
  const peso = (n) => `₱${money(n)}`;
  const norm = (s) => String(s ?? "").trim().toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ");
  const rand = (a, b, step = 500) => Math.round((a + Math.floor(Math.random() * (b - a + 1))) / step) * step;
  const iso = (month, day) => `${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  const displayDate = (d) => { const [m, day] = d.split("-").map(Number); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1]} ${day}`; };

  function makeSet() {
    const month = 1 + Math.floor(Math.random() * 12);
    const monthName = ["January","February","March","April","May","June","July","August","September","October","November","December"][month-1];
    const endDay = new Date(2026, month, 0).getDate();
    const tx = [];
    const add = (day, text, lines) => tx.push({ date: iso(month, day), text, lines });
    const investment = rand(90000, 160000, 5000);
    const equipment = rand(18000, 42000, 1000);
    const supplies = rand(5000, 12000, 500);
    const cashService = rand(10000, 24000, 1000);
    const creditService = rand(12000, 30000, 1000);
    const rent = rand(6000, 11000, 500);
    const utilities = rand(1800, 3800, 200);
    const collection = rand(4000, Math.floor(creditService * .65), 500);
    const payable = rand(2000, Math.floor(supplies * .65), 500);
    const drawing = rand(3000, 9000, 500);
    const salaries = rand(4500, 8500, 500);
    const line = (account, side, amount) => ({ account, debit: side === "debit" ? amount : 0, credit: side === "credit" ? amount : 0 });
    add(1, `The owner invested ${peso(investment)} cash in the business.`, [line("Cash","debit",investment),line("Owner's Capital","credit",investment)]);
    add(3, `Purchased equipment for ${peso(equipment)} cash.`, [line("Equipment","debit",equipment),line("Cash","credit",equipment)]);
    add(5, `Purchased office supplies on account for ${peso(supplies)}.`, [line("Office Supplies","debit",supplies),line("Accounts Payable","credit",supplies)]);
    add(8, `Provided services for ${peso(cashService)} cash.`, [line("Cash","debit",cashService),line("Service Revenue","credit",cashService)]);
    add(11, `Provided services on account for ${peso(creditService)}.`, [line("Accounts Receivable","debit",creditService),line("Service Revenue","credit",creditService)]);
    add(15, `Paid ${peso(rent)} for the month's rent.`, [line("Rent Expense","debit",rent),line("Cash","credit",rent)]);
    add(18, `Paid ${peso(utilities)} for utilities.`, [line("Utilities Expense","debit",utilities),line("Cash","credit",utilities)]);
    add(21, `Collected ${peso(collection)} from customers on account.`, [line("Cash","debit",collection),line("Accounts Receivable","credit",collection)]);
    add(24, `Paid ${peso(payable)} to suppliers on account.`, [line("Accounts Payable","debit",payable),line("Cash","credit",payable)]);
    add(27, `The owner withdrew ${peso(drawing)} cash for personal use.`, [line("Owner's Drawing","debit",drawing),line("Cash","credit",drawing)]);
    add(27, `Paid employees ${peso(salaries)} in salaries.`, [line("Salaries Expense","debit",salaries),line("Cash","credit",salaries)]);

    const journal = [];
    tx.forEach((t, ti) => t.lines.forEach(l => journal.push({ date: displayDate(t.date), account: l.account, pr: accounts[l.account].no, debit: l.debit, credit: l.credit, transaction: ti + 1 })));
    const balances = Object.fromEntries(Object.keys(accounts).map(a => [a, 0]));
    journal.forEach(j => balances[j.account] += accounts[j.account].normal === "debit" ? j.debit - j.credit : j.credit - j.debit);
    const totalDebits = journal.reduce((s,j)=>s+j.debit,0);
    const revenue = balances["Service Revenue"];
    const expenses = ["Salaries Expense","Rent Expense","Utilities Expense","Supplies Expense"].map(a=>[a,balances[a]]);
    const totalExpenses = expenses.reduce((s,[,v])=>s+v,0);
    const netIncome = revenue - totalExpenses;
    const endingCapital = balances["Owner's Capital"] + netIncome - balances["Owner's Drawing"];
    return { month: monthName, endDay, tx, journal, balances, totalDebits, revenue, expenses, totalExpenses, netIncome, endingCapital };
  }

  function renderSteps() {
    $("steps").innerHTML = stages.map((title, index) => {
      const complete = index < state.completed;
      const current = index === state.stage;
      const locked = index > state.completed;
      const status = current ? "active" : complete ? "done" : locked ? "locked" : "available";
      return `<button type="button" class="step ${status}" data-go="${index}" aria-label="${title}${complete ? ", complete" : ""}" ${current ? 'aria-current="step"' : ""} ${locked ? "disabled" : ""}><span class="step-number">${complete ? "✓" : index + 1}</span><span>${title}</span></button>`;
    }).join("");
    $("steps").querySelectorAll("[data-go]").forEach(button => {
      button.addEventListener("click", () => goToWorksheet(Number(button.dataset.go)));
    });
    $("progress-fill").style.width = `${state.completed / stages.length * 100}%`;
    $("progress-text").textContent = `${state.completed} of ${stages.length} complete`;
  }

  const field = (expected, kind="text", extra="") => `<input class="cell ${kind==='number'?'numeric':''}" data-answer="${String(expected ?? "").replaceAll('"','&quot;')}" data-kind="${kind}" ${extra} autocomplete="off" aria-label="Answer">`;
  const sheetHead = (title, subtitle="") => `<div class="sheet-head"><div><div class="eyebrow">ICT 141 · PRACTICE EXAM</div><h2>${title}</h2>${subtitle?`<p>${subtitle}</p>`:""}</div><div class="sheet-meta"><span>${state.month} · ₱</span><span>Worksheet ${state.stage+1}/6</span></div></div>`;
  const table = (heads, rows, cls="") => `<div class="table-wrap"><table class="${cls}"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
  const amount = n => n ? money(n) : "";
  const staticTable = (heads, rows, cls="example-table") => table(heads, rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join("")}</tr>`), cls);

  function ledgerExample(account, no, rows) {
    return `<section class="ledger-example-account"><div class="ledger-example-title"><strong>Account: ${account}</strong><span>Account No. ${no}</span></div>${staticTable(["Date","Items","Ref.","Debit (₱)","Credit (₱)","Balance"],rows)}</section>`;
  }
  const workedExamples = [
    {
      title: "General Journal",
      intro: "Record the debit account first and enter each account number in the PR column.",
      body: staticTable(["Date","Account Title","PR","Debit (₱)","Credit (₱)"],[
        ["Mar 1","Cash","101","50,000",""],["","Owner's Capital","301","","50,000"],
        ["Mar 3","Equipment","104","10,000",""],["","Cash","101","","10,000"],
        ["Mar 5","Office Supplies","103","2,000",""],["","Accounts Payable","201","","2,000"],
        ["Mar 10","Cash","101","8,000",""],["","Service Revenue","401","","8,000"],
        ["Mar 15","Rent Expense","502","3,000",""],["","Cash","101","","3,000"],
        ["","Totals","","73,000","73,000"]
      ])
    },
    {
      title: "General Ledger",
      intro: "Post each journal line to its account. PR in the journal uses the account number; Ref. here points back to the source journal page (GJ1). Balances below are running balances.",
      body: [
        ledgerExample("Cash","101",[["Mar 1","Owner's Capital","GJ1","50,000","","50,000 Dr"],["Mar 3","Equipment","GJ1","","10,000","40,000 Dr"],["Mar 10","Service Revenue","GJ1","8,000","","48,000 Dr"],["Mar 15","Rent Expense","GJ1","","3,000","45,000 Dr"]]),
        ledgerExample("Office Supplies","103",[["Mar 5","Accounts Payable","GJ1","2,000","","2,000 Dr"]]),
        ledgerExample("Equipment","104",[["Mar 3","Cash","GJ1","10,000","","10,000 Dr"]]),
        ledgerExample("Accounts Payable","201",[["Mar 5","Office Supplies","GJ1","","2,000","2,000 Cr"]]),
        ledgerExample("Owner's Capital","301",[["Mar 1","Cash","GJ1","","50,000","50,000 Cr"]]),
        ledgerExample("Service Revenue","401",[["Mar 10","Cash","GJ1","","8,000","8,000 Cr"]]),
        ledgerExample("Rent Expense","502",[["Mar 15","Cash","GJ1","3,000","","3,000 Dr"]])
      ].join("")
    },
    {
      title: "Trial Balance",
      intro: "List each ledger account's ending balance on its normal side. The debit and credit totals must agree.",
      body: `<p class="sheet-center"><strong>Trial Balance</strong>As of March 31</p>${staticTable(["Account No.","Account Title","Debit (₱)","Credit (₱)"],[
        ["101","Cash","45,000",""],["103","Office Supplies","2,000",""],["104","Equipment","10,000",""],["201","Accounts Payable","","2,000"],["301","Owner's Capital","","50,000"],["401","Service Revenue","","8,000"],["502","Rent Expense","3,000",""],["","Totals","60,000","60,000"]
      ])}`
    },
    {
      title: "Income Statement",
      intro: "Subtract expenses from service revenue to find net income for the period.",
      body: `<p class="sheet-center"><strong>Income Statement</strong>For the month ended March 31</p><div class="example-form"><div>Service Revenues</div><div>₱8,000</div><div class="example-sub">Less: Expenses</div><div></div><div class="example-sub">Rent Expense</div><div>3,000</div><div class="example-total">Total Expenses</div><div class="example-total">₱3,000</div><div class="example-total">Net Income</div><div class="example-total">₱5,000</div></div>`
    },
    {
      title: "Changes in Equity",
      intro: "Start with the owner's investment, add net income, subtract drawings, and calculate ending capital.",
      body: `<p class="sheet-center"><strong>Statement of Changes in Equity</strong>For the month ended March 31</p><div class="example-form"><div>Beginning capital / investment</div><div>₱50,000</div><div>Add: Additional investment</div><div>0</div><div>Add: Net income</div><div>5,000</div><div class="example-total">Total</div><div class="example-total">₱55,000</div><div>Less: Owner's Drawing</div><div>0</div><div class="example-total">Ending capital</div><div class="example-total">₱55,000</div></div>`
    },
    {
      title: "Balance Sheet",
      intro: "Show assets, liabilities, and ending equity. Total assets must equal total liabilities and equity.",
      body: `<p class="sheet-center"><strong>Balance Sheet</strong>As of March 31 · Philippine pesos</p><div class="example-form"><div class="example-section">Assets</div><div></div><div>Cash</div><div>₱45,000</div><div>Office Supplies</div><div>2,000</div><div>Equipment</div><div>10,000</div><div class="example-total">Total assets</div><div class="example-total">₱57,000</div><div class="example-section">Liabilities</div><div></div><div>Accounts Payable</div><div>2,000</div><div class="example-total">Total liabilities</div><div class="example-total">₱2,000</div><div class="example-section">Equity</div><div></div><div>Owner's Capital</div><div>55,000</div><div class="example-total">Total liabilities and equity</div><div class="example-total">₱57,000</div></div>`
    }
  ];

  function journalHTML() {
    const rows = state.journal.map(j=>`<tr><td>${field(j.date)}</td><td>${field(j.account)}</td><td>${field(j.pr)}</td><td>${field(amount(j.debit),"number")}</td><td>${field(amount(j.credit),"number")}</td><td class="rowlabel">${j.transaction}</td></tr>`);
    rows.push(`<tr class="total-row"><td colspan="3">Totals</td><td>${field(amount(state.totalDebits),"number")}</td><td>${field(amount(state.totalDebits),"number")}</td><td></td></tr>`);
    return table(["Date","Account title","PR","Debit (₱)","Credit (₱)","No."],rows,"entry-table");
  }
  function ledgerHTML() {
    const rows=[];
    Object.keys(accounts).forEach(account=>{
      const movements=state.journal.filter(j=>j.account===account);
      if(!movements.length)return;
      let bal=0;
      rows.push(`<tr class="total-row"><td colspan="4">${account}</td><td colspan="2">Account No. ${accounts[account].no}</td></tr>`);
      rows.push(`<tr><th>Date</th><th>Items / explanation</th><th>Ref.</th><th>Debit</th><th>Credit</th><th>Balance</th></tr>`);
      movements.forEach(j=>{
        bal += accounts[account].normal === "debit" ? j.debit-j.credit : j.credit-j.debit;
        const side=accounts[account].normal;
        rows.push(`<tr><td>${field(j.date)}</td><td>${field(j.account)}</td><td>${field("GJ1")}</td><td>${field(amount(j.debit),"number")}</td><td>${field(amount(j.credit),"number")}</td><td>${field(`${amount(bal)} ${bal<0?(side==='debit'?'Cr':'Dr'):side==='debit'?'Dr':'Cr'}`)}</td></tr>`);
      });
      rows.push(`<tr class="gap-row"><td colspan="6"></td></tr>`);
    });
    return table(["Date","Items / explanation","Ref.","Debit (₱)","Credit (₱)","Balance"],rows);
  }
  function trialHTML() {
    const rows=[]; let d=0,c=0;
    Object.keys(accounts).forEach(a=>{const b=state.balances[a];if(!b)return;const debit=accounts[a].normal==="debit"?b:0,credit=accounts[a].normal==="credit"?b:0;d+=debit;c+=credit;rows.push(`<tr><td>${field(accounts[a].no)}</td><td>${field(a)}</td><td>${field(amount(debit),"number")}</td><td>${field(amount(credit),"number")}</td></tr>`);});
    rows.push(`<tr class="total-row"><td></td><td>Totals</td><td>${field(amount(d),"number")}</td><td>${field(amount(c),"number")}</td></tr>`);
    return `<p class="sheet-center"><strong>Trial Balance</strong>As of ${state.month} ${state.endDay}, 2026</p>`+table(["Account No.","Account Title","Debit (₱)","Credit (₱)"],rows);
  }
  function statementRows(items) { return items.map(([label,value,cls=""])=>`<div class="form-row ${cls}"><div class="form-label">${label}</div><div class="form-field">${field(value,"number")}</div></div>`).join(""); }
  function incomeHTML() {
    return `<p class="sheet-center"><strong>Income Statement</strong>For the month ended ${state.month} ${state.endDay}, 2026</p><div class="form-grid">${statementRows([["Service Revenues",state.revenue],["Less: Expenses","","section"],...state.expenses.map(([a,v])=>[a,v,"sub"]),["Total Expenses",state.totalExpenses,"emphasis"],["Net Income",state.netIncome,"emphasis"]])}</div>`;
  }
  function equityHTML() {
    const capital=state.balances["Owner's Capital"],drawing=state.balances["Owner's Drawing"];
    return `<p class="sheet-center"><strong>Statement of Changes in Equity</strong>For the month ended ${state.month} ${state.endDay}, 2026</p><div class="form-grid">${statementRows([["Beginning capital / investment",capital],["Add: Additional investment","0"],["Add: Net income",state.netIncome],["Total",capital+state.netIncome,"emphasis"],["Less: Owner's Drawing",drawing],["Ending capital",state.endingCapital,"emphasis"]])}</div>`;
  }
  function balanceHTML() {
    const assets=["Cash","Accounts Receivable","Office Supplies","Equipment"].filter(a=>state.balances[a]);
    const liabs=["Accounts Payable"].filter(a=>state.balances[a]);
    const totalAssets=assets.reduce((s,a)=>s+state.balances[a],0), totalLiabs=liabs.reduce((s,a)=>s+state.balances[a],0);
    const items=[["Assets","","section"],...assets.map(a=>[a,state.balances[a],"sub"]),["Total assets",totalAssets,"emphasis"],["Liabilities","","section"],...liabs.map(a=>[a,state.balances[a],"sub"]),["Total liabilities",totalLiabs,"emphasis"],["Equity","","section"],["Owner's Capital",state.endingCapital,"sub"],["Total liabilities and equity",totalLiabs+state.endingCapital,"emphasis"]];
    return `<p class="sheet-center"><strong>Balance Sheet</strong>As of ${state.month} ${state.endDay}, 2026 · Philippine pesos</p><div class="form-grid">${statementRows(items)}</div>`;
  }
  const contentFor = [journalHTML,ledgerHTML,trialHTML,incomeHTML,equityHTML,balanceHTML];

  function renderWorkedExample(index) {
    const example=workedExamples[index];
    $("example-tabs").innerHTML=workedExamples.map((item,i)=>`<button class="example-tab ${i===index?'active':''}" role="tab" aria-selected="${i===index}" data-example="${i}">${item.title}</button>`).join("");
    $("example-content").innerHTML=`<p class="example-intro">${example.intro}</p>${example.body}`;
    $("example-tabs").querySelectorAll("[data-example]").forEach(button=>button.addEventListener("click",()=>renderWorkedExample(Number(button.dataset.example))));
  }

  function worksheetInputs() {
    return [...$("worksheet").querySelectorAll("input[data-answer]")];
  }

  function goToWorksheet(stage) {
    if (stage < 0 || stage >= stages.length || stage > state.completed || stage === state.stage) return;
    state.responses[state.stage] = worksheetInputs().map(input => input.value);
    state.stage = stage;
    render();
    $("worksheet").focus({ preventScroll: true });
    $("worksheet").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function render() {
    renderSteps();
    const title=stages[state.stage];
    const subtitle=["Record each transaction’s date, account titles, posting references, debits, and credits.","Post entries to each ledger account. Use GJ1 in Ref. for the source journal page, then calculate the running balance.","List every account with its ending balance on the correct side.","Use the adjusted balances to calculate the month’s result.","Carry net income and drawings into the owner’s ending equity.","Classify all assets, liabilities, and ending equity."][state.stage];
    const reviewing = state.stage < state.completed;
    $("tutor-fill").disabled = reviewing;
    const previous = state.stage > 0 ? '<button type="button" class="quiet-button" id="previous-worksheet">Previous worksheet</button>' : "";
    const primary = reviewing
      ? (state.completed < stages.length ? '<button type="button" class="primary small" id="continue-worksheet">Continue practice</button>' : "")
      : '<button type="button" class="primary small" id="check">Check my work <span>→</span></button>';
    $("worksheet").innerHTML = sheetHead(title, subtitle) + contentFor[state.stage]()
      + `<div class="feedback" id="feedback" role="status"></div><div class="sheet-actions"><span class="hint">${reviewing ? "Completed worksheet. Your checked answers are saved." : "Enter amounts as numbers. Commas and peso signs are optional."}</span><div class="worksheet-controls">${previous}${primary}</div></div>`;

    const saved = state.responses[state.stage] ?? [];
    worksheetInputs().forEach((input, index) => {
      input.value = saved[index] ?? "";
      input.readOnly = reviewing;
      input.classList.toggle("correct", reviewing && input.value.trim() !== "");
    });
    $("previous-worksheet")?.addEventListener("click", () => goToWorksheet(state.stage - 1));
    $("continue-worksheet")?.addEventListener("click", () => goToWorksheet(state.completed));
    $("check")?.addEventListener("click", checkAnswers);
    if (state.completed === stages.length) {
      $("feedback").className = "feedback good";
      $("feedback").textContent = "You completed the full accounting cycle.";
    }
  }

  function checkAnswers() {
    const inputs = worksheetInputs();
    let wrong=0, missing=0;
    inputs.forEach(input=>{
      const expected=input.dataset.answer.trim();
      const value=input.value.trim();
      let ok;
      if(expected==="" && value==="") ok=true;
      else if(input.dataset.kind==="number") {
        const actual=Number(value.replace(/[₱,\s]/g,""));
        const target=Number(expected.replace(/[₱,\s]/g,""));
        ok=value===""?false:Number.isFinite(actual)&&actual===target;
      } else ok=norm(value)===norm(expected);
      input.classList.toggle("correct",ok && value!=="");
      input.classList.toggle("incorrect",!ok);
      if(!value)missing++;
      if(!ok)wrong++;
    });
    const feedback=$("feedback");
    if(wrong) {
      feedback.className="feedback";
      feedback.textContent=`${wrong} answer${wrong===1?'':'s'} need another look${missing?` · ${missing} blank`:''}. Correct entries are outlined in green.`;
      return;
    }
    state.completed++;
    if (state.completed < stages.length) {
      goToWorksheet(state.completed);
      $("feedback").className = "feedback good";
      $("feedback").textContent = "Previous worksheet completed and saved.";
    } else {
      state.responses[state.stage] = inputs.map(input => input.value);
      render();
      $("worksheet").focus({ preventScroll: true });
    }
  }

  const worksheetHints = [
    "Read one transaction at a time. Identify the accounts that changed and whether each increased or decreased. Then record the debit and credit and check that the amounts match.",
    "Start with one account. Find every journal line for that account, copy the date and amount to the matching debit or credit column, and update the running balance from the previous row.",
    "Take each account’s ending balance from its ledger. Enter that balance once, on the debit or credit side where it ends. Then compare the column totals.",
    "Bring in Service Revenue and the expense balances from the trial balance. Add the expenses, then subtract that total from revenue to find net income or loss.",
    "Start with the owner’s capital and include net income or subtract a net loss. Subtract the owner’s drawings to find ending equity.",
    "Group ending balances into assets and liabilities. Bring in ending equity from the Statement of Changes in Equity, then check that assets equal liabilities plus equity."
  ];
  const tutorEndpoint = document.querySelector('meta[name="ako-tutor-api"]')?.content.trim();
  const tutorReady = tutorEndpoint
    ? "Your question and practice scenario are sent to the tutor service."
    : "AI chat is awaiting setup. Guided hints are available.";
  const tutorWelcome = "Ask for a hint or a direct answer. To enter answers in your current worksheet, select Fill empty answers. Then review them and press Check my work.";
  let tutorRequest;
  let tutorHistory = [];

  function addTutorMessage(speaker, message) {
    const log = $("tutor-log");
    const bubble = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = speaker + ": ";
    bubble.classList.toggle("tutor-user", speaker === "You");
    bubble.append(label, message);
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function guidedReply(question, stage) {
    const topic = norm(question).replaceAll("’", "'");
    if (/\b(pr|ref|posting reference)\b/.test(topic)) {
      return "In the General Journal, PR is the account number from the Chart of Accounts. In this General Ledger, Ref. is the source journal page, GJ1. The account number belongs in the ledger account header.";
    }
    if (/\b(debits?|credits?|normal balance)\b/.test(topic)) {
      return "Assets, expenses, and drawings normally carry debit balances. Liabilities, owner’s capital, and revenue normally carry credit balances. An increase goes on the normal side, and a decrease goes on the opposite side.";
    }
    const account = Object.keys(accounts).find(name => topic.includes(name.toLowerCase()));
    if (account) {
      const { no, normal } = accounts[account];
      return `${account} is account ${no} and normally has a ${normal} balance. If you’re recording a transaction, decide whether it increases or decreases before choosing a column.`;
    }
    return worksheetHints[stage];
  }

  function fillWorksheet() {
    if (!state || state.stage < state.completed) {
      addTutorMessage("AKO", "This worksheet is already complete. Select Continue practice to work on your current worksheet.");
      return;
    }
    let filled = 0;
    const inputs = worksheetInputs();
    inputs.forEach(input => {
      if (input.value.trim() || !input.dataset.answer) return;
      input.value = input.dataset.answer;
      input.classList.remove("incorrect", "correct");
      filled++;
    });
    state.responses[state.stage] = inputs.map(input => input.value);
    addTutorMessage("AKO", filled
      ? `Filled ${filled} empty answers in ${stages[state.stage]} using this practice set’s calculated answers. Review the worksheet, then press Check my work. Your existing entries are saved.`
      : "There are no empty answers to fill. Review your entries and press Check my work.");
  }

  async function askTutor(event) {
    event.preventDefault();
    const input = $("tutor-question");
    const question = input.value.trim();
    if (!question || tutorRequest) return;

    const request = new AbortController();
    tutorRequest = request;
    const stage = state.stage;
    const mode = $("tutor-mode");
    const send = $("tutor-send");
    const timeout = setTimeout(() => request.abort(), 30000);
    let reply = guidedReply(question, stage);
    let speaker = "Guided hint";
    let status = tutorReady;
    addTutorMessage("You", question);
    input.value = "";
    send.disabled = true;
    try {
      if (tutorEndpoint) {
        mode.textContent = "AKO is working on a reply…";
        const context = {
          worksheet: stages[stage],
          chart: Object.entries(accounts).map(([title, { no, normal }]) => `${no} ${title} (${normal})`).join("\n"),
          transactions: state.tx.map(({ date, text }, i) => `${i + 1}. ${displayDate(date)}: ${text}`),
          generatedAnswers: {
            journal: state.journal,
            journalTotalForEachSide: state.totalDebits,
            endingLedgerBalancesOnNormalSides: state.balances,
            totalExpenses: state.totalExpenses,
            netIncome: state.netIncome,
            endingCapital: state.endingCapital
          },
          recentConversation: tutorHistory,
          question
        };
        const response = await fetch(tutorEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(context),
          signal: request.signal,
          credentials: "omit"
        });
        if (response.status === 429) {
          status = "Too many requests. Try again in a minute. Here’s a guided hint.";
        } else {
          if (!response.ok) throw new Error("Tutor request failed");
          const { reply: answer } = await response.json();
          if (typeof answer !== "string" || !answer.trim()) throw new Error("Empty tutor response");
          reply = answer.trim();
          speaker = "AKO AI";
        }
      }
    } catch {
      status = "AI chat is temporarily unavailable. Here’s a guided hint.";
    } finally {
      clearTimeout(timeout);
      if (tutorRequest === request) {
        addTutorMessage(speaker, reply);
        if (speaker === "AKO AI") {
          tutorHistory = [...tutorHistory.slice(-1), { question, reply: reply.slice(0, 1200) }];
        }
        mode.textContent = status;
        send.disabled = false;
        tutorRequest = undefined;
      }
    }
  }

  function start() {
    tutorRequest?.abort();
    tutorRequest = undefined;
    tutorHistory = [];
    $("tutor-send").disabled = false;
    $("tutor-question").value = "";
    $("tutor-mode").textContent = tutorReady;
    $("tutor-log").replaceChildren();
    addTutorMessage("AKO", tutorWelcome);
    state = { ...makeSet(), stage: 0, completed: 0, responses: [] };
    $("transactions").classList.remove("hidden");
    $("practice-chart-body").append($("chart-table"));
    $("practice-chart").open=true;
    $("welcome").classList.add("hidden"); $("workspace").classList.remove("hidden");
    $("problem-title").textContent=`Monthly transactions · ${state.month} 2026`;
    $("transactions").innerHTML=state.tx.map((t,i)=>`<div class="transaction"><time>${displayDate(t.date)}</time><span>${t.text}</span></div>`).join("");
    $("toggle-problem").textContent="Hide transactions";
    render(); window.scrollTo({top:0,behavior:"smooth"});
  }
  $("generate").addEventListener("click",start);
  $("tutor-form").addEventListener("submit", askTutor);
  $("tutor-hint").addEventListener("click", () => addTutorMessage("Guided hint", worksheetHints[state.stage]));
  $("tutor-fill").addEventListener("click", fillWorksheet);
  $("new-set").addEventListener("click",()=>{if(confirm("Start a new set? Your current answers will be cleared."))start();});
  $("toggle-problem").addEventListener("click",()=>{
    const list=$("transactions");list.classList.toggle("hidden");
    $("toggle-problem").textContent=list.classList.contains("hidden")?"Show transactions":"Hide transactions";
  });
  $("open-chart").addEventListener("click",()=>{
    if ($("workspace").classList.contains("hidden")) {
      $("chart-dialog").showModal();
    } else {
      $("practice-chart").open=true;
      $("practice-chart-title").focus();
    }
  });
  $("close-chart").addEventListener("click",()=>$("chart-dialog").close());
  $("chart-dialog").addEventListener("click",event=>{if(event.target===$("chart-dialog"))$("chart-dialog").close();});
  const examplesDialog=$("examples-dialog");
  const closeExamples=()=>{
    if(typeof examplesDialog.close==="function") examplesDialog.close();
    else examplesDialog.removeAttribute("open");
  };
  const showExamples=()=>{
    renderWorkedExample(0);
    if(typeof examplesDialog.showModal==="function") examplesDialog.showModal();
    else examplesDialog.setAttribute("open","");
  };
  $("open-examples").addEventListener("click",showExamples);
  $("welcome-examples").addEventListener("click",showExamples);
  $("close-examples").addEventListener("click",closeExamples);
  examplesDialog.addEventListener("click",event=>{if(event.target===examplesDialog)closeExamples();});
})();
