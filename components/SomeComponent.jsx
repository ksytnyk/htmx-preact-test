import {useState} from 'preact/hooks';

export default function SomeComponent() {
  const [text, setText] = useState('');
  return (
    <div id="click-me" onChange={() => setText(text + '2')}>
      Click Me: {text}
    </div>);
}
