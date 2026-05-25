const fs = require("fs");

const path = "apps/web/src/app/booking/page.tsx";
const content = fs.readFileSync(path, "utf8");
const lines = content.split(/\r?\n/);

let output = "";

function write(text = "") {
  output += text + "\n";
}

function printAround(label, matcher, radius = 35) {
  const index = lines.findIndex((line) => line.includes(matcher));

  write(`\n--- ${label} ---`);

  if (index === -1) {
    write(`NOT FOUND: ${matcher}`);
    return;
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length, index + radius + 1);

  for (let i = start; i < end; i++) {
    write(`${String(i + 1).padStart(4, " ")} | ${lines[i]}`);
  }
}

write("CUSTOM ROUTE DIAGNOSIS\n");

const checks = [
  "type BookingForm",
  "const initialForm",
  "const selectedRoute",
  "function selectRoute",
  "function validateBookingForm",
  "async function estimatePrice",
  "async function submitBooking",
  "function BookingFormView",
  "<BookingFormView",
  "<RoutePicker",
];

for (const check of checks) {
  const index = lines.findIndex((line) => line.includes(check));
  write(`${index === -1 ? "MISSING" : "FOUND"}: ${check}${index === -1 ? "" : ` at line ${index + 1}`}`);
}

printAround("BookingForm type", "type BookingForm", 35);
printAround("initialForm", "const initialForm", 35);
printAround("selectedRoute area", "const selectedRoute", 25);
printAround("BookingFormView call", "<BookingFormView", 40);
printAround("BookingFormView signature", "function BookingFormView", 55);
printAround("Route picker area", "<RoutePicker", 45);
printAround("validateBookingForm", "function validateBookingForm", 65);
printAround("estimatePrice", "async function estimatePrice", 80);
printAround("submitBooking", "async function submitBooking", 80);

fs.writeFileSync("custom-route-diagnosis.txt", output, "utf8");

console.log("Diagnosis saved to custom-route-diagnosis.txt");
