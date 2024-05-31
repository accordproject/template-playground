import { useState } from "react";
import { Dropdown, DropdownProps } from "semantic-ui-react";

import useAppStore from "./store";

function SampleDropdown() {
  const [loading, setLoading] = useState(false);

  const samples = useAppStore((state) => state.samples);
  const loadSample = useAppStore((state) => state.loadSample);

  const items = samples.map((s) => ({
    text: s.NAME,
    value: s.NAME,
  }));

  const handleMenuClick = async (data: DropdownProps) => {
    const { value } = data;
    setLoading(true);
    try {
      if (typeof value === "string") {
        await loadSample(value);
        alert(`Loaded ${value} sample`);
      } else {
        throw new Error("Invalid sample value");
      }
    } catch (error) {
      alert("Failed to load sample");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dropdown
      placeholder="Select Sample"
      options={items}
      loading={loading}
      onChange={handleMenuClick}
      button
      className="icon"
      search
      selection
    />
  );
}

export default SampleDropdown;
