import { useEffect, useState } from "react";
import {
  Container,
  Header,
  Grid,
  Segment,
  Accordion,
  AccordionTitleProps,
} from "semantic-ui-react";

import AgreementData from "./AgreementData";
import AgreementHtml from "./AgreementHtml";
import Errors from "./Errors";
import TemplateMarkdown from "./TemplateMarkdown";
import TemplateModel from "./TemplateModel";
import useAppStore from "./store";
import SampleDropdown from "./SampleDropdown";

const App = () => {
  const init = useAppStore((state) => state.init);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const handleAccordionClick = (titleProps: AccordionTitleProps) => {
    const { index } = titleProps;
    if (typeof index === "number") {
      const newIndex = activeIndex === index ? -1 : index;
      setActiveIndex(newIndex);
    }
  };

  useEffect(() => {
    void init();
  }, [init]);

  const panels = [
    {
      key: "templateMark",
      label: "TemplateMark",
      content: { content: <TemplateMarkdown />, key: "templateMark" },
    },
    {
      key: "model",
      label: "Concerto Model",
      content: { content: <TemplateModel />, key: "model" },
    },
    {
      key: "data",
      label: "Preview Data",
      content: { content: <AgreementData />, key: "data" },
    },
  ];

  return (
    <Container>
      <Segment>
        <Header as="h2" textAlign="center">
          Template Playground{" "}
          <span style={{ fontSize: "80%", color: "#87CEEB" }}>(BETA)</span>
        </Header>
      </Segment>
      <Segment>
        <Grid>
          <Grid.Row>
            <Grid.Column width={4}>
              <SampleDropdown />
            </Grid.Column>
            <Grid.Column width={8}>
              <Errors />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={10}>
              <Accordion fluid styled>
                {panels.map((panel, index) => (
                  <div key={panel.key}>
                    <Accordion.Title
                      active={activeIndex === index}
                      index={index}
                      onClick={handleAccordionClick}
                    >
                      {panel.label}
                    </Accordion.Title>
                    <Accordion.Content active={activeIndex === index}>
                      {panel.content.content}
                    </Accordion.Content>
                  </div>
                ))}
              </Accordion>
            </Grid.Column>
            <Grid.Column width={6}>
              <AgreementHtml />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    </Container>
  );
};

export default App;
