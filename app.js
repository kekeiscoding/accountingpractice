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
    tx.forEach((t, ti) => t.lines.forEach((l, li) => journal.push({ date: displayDate(t.date), account: l.account, pr: accounts[l.account].no, debit: l.debit, credit: l.credit, explanation: li === 0 ? `To record ${t.text[0].toLowerCase()}${t.text.slice(1)}` : "" , transaction: ti + 1 })));
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
    $("steps").innerHTML = stages.map((s,i) => `<button class="step ${i===state.stage?'active':i<state.stage?'done':'locked'}" ${i<state.stage?`data-go="${i}"`:''}><span class="step-number">${i<state.stage?'✓':i+1}</span><span>${s}</span></button>`).join("");
    $("steps").querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{state.stage=Number(b.dataset.go);render();}));
    $("progress-fill").style.width = `${state.stage / stages.length * 100}%`;
    $("progress-text").textContent = `${state.stage} of ${stages.length} complete`;
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
      intro: "Record each transaction with the debit account first, the credit account indented, the account number in PR, and an explanation.",
      body: staticTable(["Date","Account Title and Explanation","PR","Debit (₱)","Credit (₱)"],[
        ["Mar 1","Cash","101","50,000",""],["","Owner's Capital","301","","50,000"],["","To record owner's investment.","","",""],
        ["Mar 3","Equipment","104","10,000",""],["","Cash","101","","10,000"],["","To record equipment purchased for cash.","","",""],
        ["Mar 5","Office Supplies","103","2,000",""],["","Accounts Payable","201","","2,000"],["","To record supplies purchased on account.","","",""],
        ["Mar 10","Cash","101","8,000",""],["","Service Revenue","401","","8,000"],["","To record services provided for cash.","","",""],
        ["Mar 15","Rent Expense","502","3,000",""],["","Cash","101","","3,000"],["","To record rent paid.","","",""],
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
    const rows = state.journal.map(j=>`<tr><td>${field(j.date)}</td><td>${field(j.account)}</td><td>${field(j.pr)}</td><td>${field(amount(j.debit),"number")}</td><td>${field(amount(j.credit),"number")}</td><td>${field(j.explanation)}</td><td class="rowlabel">${j.transaction}</td></tr>`);
    rows.push(`<tr class="total-row"><td colspan="3">Totals</td><td>${field(amount(state.totalDebits),"number")}</td><td>${field(amount(state.totalDebits),"number")}</td><td colspan="2"></td></tr>`);
    return table(["Date","Account title","PR","Debit (₱)","Credit (₱)","Explanation","No."],rows,"entry-table");
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

  function render() {
    renderSteps();
    const title=stages[state.stage];
    const subtitle=["Record each transaction with its account titles, posting reference, debit, credit, and a brief explanation.","Post entries to each ledger account. Use GJ1 in Ref. for the source journal page, then calculate the running balance.","List every account with its ending balance on the correct side.","Use the adjusted balances to calculate the month’s result.","Carry net income and drawings into the owner’s ending equity.","Classify all assets, liabilities, and ending equity."][state.stage];
    $("worksheet").innerHTML=sheetHead(title,subtitle)+contentFor[state.stage]()+`<div class="feedback" id="feedback"></div><div class="sheet-actions"><span class="hint">Enter amounts as numbers. Commas and peso signs are optional.</span><button class="primary small" id="check">Check my work <span>→</span></button></div>`;
    $("check").addEventListener("click",checkAnswers);
  }

  function checkAnswers() {
    const inputs=[...$("worksheet").querySelectorAll("input[data-answer]")];
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
    feedback.className="feedback good";
    if(state.stage<stages.length-1) {
      feedback.textContent="Excellent — this worksheet is complete. The next section is unlocked.";
      state.stage++;
      renderSteps();
      setTimeout(()=>{render();document.querySelector(".worksheet").scrollIntoView({behavior:"smooth",block:"start"});},650);
    } else {
      feedback.textContent="Perfect score. You completed the full accounting cycle! Generate another set to keep practicing.";
      $("check").textContent="Completed ✓";
      $("check").disabled=true;
    }
  }

  function start() {
    state=makeSet(); state.stage=0;
    $("practice-chart-body").append($("chart-table"));
    $("practice-chart").open=true;
    $("welcome").classList.add("hidden"); $("workspace").classList.remove("hidden");
    $("problem-title").textContent=`Monthly transactions · ${state.month} 2026`;
    $("transactions").innerHTML=state.tx.map((t,i)=>`<div class="transaction"><time>${displayDate(t.date)}</time><span>${t.text}</span></div>`).join("");
    $("toggle-problem").textContent="Hide transactions";
    render(); window.scrollTo({top:0,behavior:"smooth"});
  }
  $("generate").addEventListener("click",start);
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
