import Dropdown, { Option } from 'react-dropdown';
import 'react-dropdown/style.css';

import useAppStore from './store';

function SampleDropdown() {
  const samples = useAppStore((state) => state.samples)
  const loadSample = useAppStore((state) => state.loadSample)
  const sampleName = useAppStore((state) => state.sampleName)

  function onSelect(arg:Option) {
    void loadSample(arg.value);
  }

  return <div>
    <Dropdown options={samples.map( s => s.NAME)} onChange={onSelect} value={sampleName} placeholder="Load a sample" />
  </div>
}

export default SampleDropdown;
