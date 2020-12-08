function compoundInterest(initialBalance, interestRate, periodsElapsed) {
    return initialBalance * (1 + interestRate) ** periodsElapsed
}

function formatMoney(amount) {
    try {
        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(0)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;
        return (j ? i.substr(0, j) + ',' : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + ',') ;
    } catch (e) {
        console.error(e);
    }
}

const apikeyInput = document.getElementById("key");
const meritInput = document.getElementById("merits");
const stockInput = document.getElementById("stock");
const investmentPeriods = {"1w": 7, "2w": 14, "1m": 30, "2m": 60, "3m": 90}

apikeyInput.addEventListener("input", function (event) {
    if (apikeyInput.value) {
        meritInput.disabled = true;
        stockInput.disabled = true;
    } else {
        meritInput.disabled = false;
        stockInput.disabled = false;
    }
});

var rates = {"bank": {"1w": "37.17", "2w": "41.79", "1m": "49.61", "2m": "49.28", "3m": "56.40"}};

function calculate() {
    let apikey = apikeyInput.value;
    let investment = document.getElementById("investment").value;
    let duration = document.getElementById("duration").value;
    let merits = meritInput.value;
    let stock = stockInput.checked;
    let output = document.getElementById("output");

    function updateOutput() {
        let outputArray = [];
        Object.entries(investmentPeriods).forEach(function([key, value]) {
            let apr = (parseFloat(rates.bank[key]) / 100 * (1 + 0.05 * merits + 0.1 * stock)).toFixed(4);
            let periods = duration * 7 / value; 
            if (periods < 1) {return;}
            let adjustedRate = apr * value / 365;
            outputArray.push(key + ": $" + formatMoney(Math.floor(compoundInterest(investment, adjustedRate, periods))));
        });
        output.innerHTML = outputArray.join("<br>");
    }

    if (apikey) {
        let ratesUpdated;
        let resp;
        fetch(`https://api.torn.com/torn/?selections=bank&key=${apikey}`).then(response => response.text()).then(body => {
            try {
                ratesUpdated = JSON.parse(body);
            } catch {
                throw Error(body);
            }
        }).then(console.log).catch(console.error);
        fetch(`https://api.torn.com/user/?selections=merits,perks&key=${apikey}`).then(response => response.text()).then(body => {
            try {
                resp = JSON.parse(body);
            } catch {
                throw Error(body);
            }
        }).then(console.log).catch(console.error);

        function waitForResponses() {
            if (typeof ratesUpdated !== "undefined" && typeof resp !== "undefined") {
                rates = ratesUpdated;
                // catch invalid api key before this point
                merits = resp.merits["Bank Interest"];
                Object.entries(resp.stock_perks).forEach(function([key, value]) {
                    if (value.includes("TCIB")) {
                        stock = true;
                    }
                });
                updateOutput();
            } else {
                setTimeout(waitForResponses, 1000);
            }
        }
        waitForResponses();
    } else {
        updateOutput();
    }
}
