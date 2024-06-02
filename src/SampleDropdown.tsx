import { useState } from "react";
import { Dropdown, DropdownProps, Loader } from "semantic-ui-react";
import { toast } from "react-hot-toast";
import useAppStore from "./store";

function SampleDropdown() {
  const [loading, setLoading] = useState(false);

  const samples = useAppStore((state) => state.samples);
  const loadSample = useAppStore((state) => state.loadSample);

  const items = samples.map((s) => ({
    text: s.NAME,
    value: s.NAME,
    key: s.NAME,
  }));

  const handleDropdownChange = async (
    _event: React.SyntheticEvent<HTMLElement>,
    data: DropdownProps
  ) => {
    const { value } = data;
    if (typeof value === "string") {
      setLoading(true);
      try {
        await loadSample(value);
        toast.success(`Loaded ${value} sample`);
      } catch (error) {
        toast.error("Failed to load sample");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <Dropdown
        placeholder="Select Sample"
        fluid
        selection
        search
        options={items}
        onChange={handleDropdownChange}
        disabled={loading}
      />
      {loading && (
        <Loader
          active
          size="mini"
          style={{
            position: "absolute",
            top: "50%",
            right: 0,
            transform: "translateY(-50%)",
          }}
        />
      )}
    </div>
  );
}

export default SampleDropdown;
