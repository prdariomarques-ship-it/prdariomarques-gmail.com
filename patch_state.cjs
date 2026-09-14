const fs = require('fs');
const file = 'src/components/NotificationSettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetState = `  const [testingChannel, setTestingChannel] = useState<'EMAIL' | 'SMS' | 'ALL' | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');`;
const replacementState = `  const [testingChannel, setTestingChannel] = useState<'EMAIL' | 'SMS' | 'ALL' | null>(null);
  const [testEmailAddress, setTestEmailAddress] = useState<string>('');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');`;

if (!content.includes(targetState)) {
  console.log("Could not find target block");
} else {
  content = content.replace(targetState, replacementState);
  fs.writeFileSync(file, content);
  console.log("Success");
}
