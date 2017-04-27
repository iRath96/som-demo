import * as React from "react";

import { Tabs, Tab } from "material-ui/Tabs";
import FontIcon from "material-ui/FontIcon";

import ScatterPlot from "./ScatterPlot";
import GridPlot from "./GridPlot";

import DataTab from "./tabs/DataTab";
import ModelTab from "./tabs/ModelTab";
import TrainTab from "./tabs/TrainTab";
import SettingsTab from "./tabs/SettingsTab";

import DatasetSource from "som/DatasetSource";
import SOMController from "client/src/SOM";

const style = require("./App.scss");


interface IState {
  animationInterval: number | null;
  stepAnimationInterval: number | null;
  animationSpeed: number;

  modelRevision: number;
  datasetRevision: number;

  selectedDatasource: DatasetSource | null;

  quantizationError: number;
  topographicError: number;

  displayMap: boolean;
  displayUMatrix: boolean;
}

export default class App extends React.Component<void, IState> {
  som: SOMController = new SOMController();

  errorPrecision = {
    animating: 100,
    idle: 1000
  };
  
  constructor() {
    super();

    this.state = {
      animationInterval: null,
      stepAnimationInterval: null,
      animationSpeed: 1,

      datasetRevision: 0,
      modelRevision: 0,

      selectedDatasource: null,

      quantizationError: 0,
      topographicError: 0,

      displayMap: true,
      displayUMatrix: true
    };
  }

  protected initializeModel() {
    this.som.initialize();
    this.recalculateError(this.errorPrecision.idle);
  }

  componentDidMount() {
    this.initializeModel();
  }

  protected recalculateError(sampleCount: number) {
    let { eQ, eT } = this.som.getErrors();
    this.setState({
      quantizationError: eQ,
      topographicError: eT
    });
  }

  protected startAnimating() {
    if (this.isAnimating || this.som.trainer.hasFinished)
      return;
    
    let animationCounter = 0;
    this.setState({
      animationInterval: setInterval(() => {
        if (this.som.trainer.hasFinished) {
          this.stopAnimating();
          return;
        }

        animationCounter += this.state.animationSpeed;

        let iterationCount = Math.floor(animationCounter);
        
        this.som.iterate(iterationCount);
        this.recalculateError(this.errorPrecision.animating);

        animationCounter -= iterationCount;
        console.log(animationCounter);
      }, 1000 / 30) as any
    })
  }

  protected stopAnimating() {
    clearInterval(this.state.animationInterval as any);

    this.recalculateError(this.errorPrecision.idle);
    this.setState({
      animationInterval: null
    });
  }

  protected iterateSingle() {
    if (this.state.stepAnimationInterval !== null)
      // already animating
      return;
    
    let targetWeightMatrix = this.som.model.weightMatrix.cloneWithoutData();
    this.som.trainer.iterate(1, targetWeightMatrix);

    // perform animation

    let t = 0;
    let prevE = 0;

    this.setState({
      stepAnimationInterval: setInterval(() => {
        // calculate interpolation parameters
        let e = t < 0.5 ? 4 * Math.pow(t, 3) : 4 * Math.pow(t - 1, 3) + 1;
        let aFactor = (1 - e) / (1 - prevE);
        let bFactor = (e - prevE) / (1 - prevE);
        prevE = e;

        // update neuron weights
        for (let neuronIndex = 0; neuronIndex < this.som.model.neuronCount; ++neuronIndex) {
          let target = targetWeightMatrix.getRow(neuronIndex);
          target.forEach((b, dim) => {
            let a = this.som.model.weightMatrix.get(neuronIndex, dim);
            this.som.model.weightMatrix.set(neuronIndex, dim, a * aFactor + b * bFactor);
          });
        };

        if (t >= 1) {
          clearInterval(this.state.stepAnimationInterval as any);
          
          this.recalculateError(this.errorPrecision.idle);
          this.setState({
            stepAnimationInterval: null
          });

          return;
        } else
          this.forceUpdate();

        t += 0.05; // @todo Magic constant
      }, 1000 / 30) as any
    });
  }

  get isAnimating() {
    return this.state.animationInterval !== null;
  }

  protected reset() {
    this.stopAnimating();
    this.initializeModel();
  }

  render() {
    return <div>
      <div className={style["main-view"]}>
        <ScatterPlot
          dataset={this.som.dataset}
          datasetRevision={this.state.datasetRevision}
          currentSample={this.som.trainer.currentSample}
          
          model={this.som.model}
          modelRevision={this.state.modelRevision}

          animating={
            this.state.animationInterval !== null ||
            this.state.stepAnimationInterval !== null
          }
        />
      </div>
      <div className={style["grid-plot"]}>
        <GridPlot
          model={this.som.model}
          tileWidth={8}
          tileHeight={8}
          width={this.som.model.width}
          height={this.som.model.height}
          displayMap={this.state.displayMap}
          displayUMatrix={this.state.displayUMatrix}
        />
      </div>
      <div className={style["sidebar"]}>
        <Tabs style={{ height: "100%", overflow: "scroll" }}>
          <Tab
            icon={<FontIcon className="material-icons">pie_chart</FontIcon>}
            label="DATA"
          >
            <DataTab
              dataset={this.som.dataset}
              revision={this.state.datasetRevision}
              onUpdate={() => {
                this.initializeModel();
                this.setState({ datasetRevision: this.state.datasetRevision + 1 });
              }}
              onSelect={selectedDatasource => this.setState({ selectedDatasource })}
            />
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">apps</FontIcon>}
            label="MODEL"
          >
            <ModelTab
              model={this.som.model}
              initializer={this.som.initializer}
              trainer={this.som.trainer}

              modelRevision={this.state.modelRevision}

              onUpdateModel={() => {
                this.initializeModel();
                this.setState({ modelRevision: this.state.modelRevision + 1 });
              }}
              onUpdateTrainer={() => {
                this.forceUpdate();
              }}
              onChangeInitializer={initializer => {
                this.som.initializer = initializer;
                this.initializeModel();
              }}
            />
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">last_page</FontIcon>}
            label="TRAIN"
          >
            <TrainTab
              trainer={this.som.trainer}
              
              quantizationError={this.state.quantizationError}
              topographicError={this.state.topographicError}

              isTraining={this.isAnimating}

              animationSpeed={this.state.animationSpeed}
              setAnimationSpeed={animationSpeed => this.setState({ animationSpeed })}

              startTraining={() => this.startAnimating()}
              endTraining={() => this.stopAnimating()}
              iterateSingle={() => this.iterateSingle()}

              reset={() => this.reset()}
            />
          </Tab>
          <Tab
            icon={<FontIcon className="material-icons">settings</FontIcon>}
            label="OTHER"
          >
            <SettingsTab
              displayMap={this.state.displayMap}
              displayUMatrix={this.state.displayUMatrix}

              onUpdateDisplayMap={displayMap => this.setState({ displayMap })}
              onUpdateDisplayUMatrix={displayUMatrix => this.setState({ displayUMatrix })}
            />
          </Tab>
        </Tabs>
      </div>
    </div>;
  }
}
