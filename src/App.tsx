import { useEffect, useState } from "react";
import {
  Container,
  Grid,
  Segment,
  Accordion,
  AccordionTitleProps,
  Icon,
} from "semantic-ui-react";

import Navbar from "./Navbar";
import AgreementData from "./AgreementData";
import AgreementHtml from "./AgreementHtml";
import "./App.css";
import Errors from "./Errors";
import TemplateMarkdown from "./TemplateMarkdown";
import TemplateModel from "./TemplateModel";
import useAppStore from "./store";
import SampleDropdown from "./SampleDropdown";

const App = () => {
  const init = useAppStore((state) => state.init);
  const [activeIndex, setActiveIndex] = useState<number[]>([]);

  const scrollToExplore = () => {
    const exploreContent = document.getElementById("explore");
    if (exploreContent) {
      exploreContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAccordionClick = (
    _event: React.MouseEvent,
    titleProps: AccordionTitleProps
  ) => {
    const { index } = titleProps;
    if (typeof index === "number") {
      const currentIndex = activeIndex.indexOf(index);
      let newIndexes: number[];
      if (currentIndex === -1) {
        newIndexes = [...activeIndex, index];
      } else {
        newIndexes = [
          ...activeIndex.slice(0, currentIndex),
          ...activeIndex.slice(currentIndex + 1),
        ];
      }
      setActiveIndex(newIndexes);
    }
  };

  useEffect(() => {
    void init();
  }, [init]);

  const panels = [
    {
      key: "templateMark",
      label: "TemplateMark",
      content: <TemplateMarkdown />,
    },
    {
      key: "model",
      label: "Concerto Model",
      content: <TemplateModel />,
    },
    {
      key: "data",
      label: "Preview Data",
      content: <AgreementData />,
    },
  ];

  return (
    <Container>
      <Navbar scrollToExplore={scrollToExplore} />
      <Container
        style={{
          marginTop: 60,
          padding: 24,
          minHeight: 360,
        }}
      >
        <Segment>
          <Grid>
            <Grid.Row id="explore">
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
                        active={activeIndex.includes(index)}
                        index={index}
                        onClick={handleAccordionClick}
                        style={{ color: "#777", cursor: "pointer" }}
                      >
                        <Icon
                          name={
                            activeIndex.includes(index)
                              ? "angle down"
                              : "angle right"
                          }
                        />
                        {panel.label}
                      </Accordion.Title>
                      <Accordion.Content active={activeIndex.includes(index)}>
                        {panel.content}
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
    </Container>
  );
};

export default App;
