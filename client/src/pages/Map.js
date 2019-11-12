import React, { Component } from "react";
import ReactMapboxGl, {
  Layer,
  Feature,
  Popup,
  MapContext
} from "react-mapbox-gl";
import mapboxgl from "mapbox-gl";
import ListGroup from "react-bootstrap/ListGroup";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";

/**
 * @desc Transforms an array of strings into an array of objects
 * where in each object contains the string and the number of
 * occurances
 * @param arr [String]
 * @returns [{ city: String, count: Number }]
 **/
function count(arr) {
  const output = [];
  arr.forEach(city => {
    const count = arr.filter(c => c === city).length;
    // check that the city doesn't exist already
    const exists = output.filter(c => c.city === city).length > 0;
    if (!exists) {
      output.push({ city, count });
    }
  });
  return output;
}

/**
 * @desc Returns a random item from an array
 * @param arr [any]
 * @returns any
 **/
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MapView = ReactMapboxGl({
  accessToken:
    "pk.eyJ1IjoiYXdlZWQxIiwiYSI6ImNrMGZxa2ZldTAyNHMzb3M4YTZyM3QxNzMifQ.qZtFXEGeC-VE3IwTKHIk_g",
  minZoom: 8,
  maxZoom: 20
});

const defaultCenter = [-75.3499, 39.9021];
const onClickZoomLevel = [18];
const defaultZoomLevel = [11];

const popupStyles = {
  backgroundColor: "white",
  borderRadius: "8px 8px 0px 0px",
  maxWidth: "25em"
};

class Map extends Component {
  constructor() {
    super();
    this.state = {
      map: {
        viewport: {
          center: defaultCenter,
          zoom: defaultZoomLevel,
          fitBounds: undefined
        }
      },
      filter: "",
      viewing: "", // this is the project the user is currently interacting with
      isLoading: false,
      projects: "",
      error: ""
    };
    this.onFilterChange = this.onFilterChange.bind(this);
    this.onViewportChange = this.onViewportChange.bind(this);
    this.projectBtnOnClick = this.projectBtnOnClick.bind(this);
    this.featureOnClick = this.featureOnClick.bind(this);
  }

  componentDidMount() {
    this.setState({ isLoading: true });

    fetch("/api/projects")
      .then(res => res.json())
      .then(results => {
        this.setState({ projects: results.data.projects });
        this.getCities(results.data.projects);
      })
      .catch(error => this.setState({ error }))
      .finally(() => this.setState({ isLoading: false }));
  }

  getCities(projects) {
    const cities = projects.map(project => project.address.city);
    const cityFilters = count(cities);
    // sort the city filters (desc)
    const sorted = cityFilters.sort((a, b) => (a.count < b.count ? 1 : -1));
    this.setState({ cityFilters: sorted });
  }

  onFilterChange(e) {
    const { name, value } = e.target;
    const { projects } = this.state;
    const listItems = document.getElementsByClassName("project-list");

    this.setState({
      [name]: value
    });

    value.toLowerCase();
    projects.forEach(
      (project, i) =>
        // compare value to project.name
        project.name.toLowerCase().includes(value) ||
        project.description.toLowerCase().includes(value) ||
        project.type.toLowerCase().includes(value) ||
        project.owner.first.toLowerCase().includes(value) ||
        project.owner.last.toLowerCase().includes(value)
          ? (listItems[i].style.display = "block")
          : (listItems[i].style.display = "none")

      // compare value to project.description
      // compare value to project.category
      // get element with key = i , set show or hide
    );
    // When the filter text is changed, it should filter the list of projects containing
    // only text with whatever the text string is. We will need to figure out what fields
    // on the project itself should allow filtering against.
  }

  onViewportChange() {
    console.log("Changing map view....");
  }

  projectBtnOnClick(project) {
    //Close any existing popups
    const popups = document.getElementsByClassName("popup");
    const l = popups.length;
    for (let i = 0; i < l; i++) {
      console.log(popups[i]);
      popups[i].remove();
    }

    this.setState({
      map: {
        viewport: {
          center: [project.address.lat, project.address.lng],
          zoom: onClickZoomLevel
        }
      },
      viewing: project
    });
  }

  featureOnClick(project, mapbox) {
    // When a feature (the actual marker on the map) is clicked, a pop
    // of the project description should show up, and the map should
    // recenter / zoom to where that feature is located

    // This takes care of the popover

    // This takes care of recentering the map
    this.setState({
      map: {
        viewport: {
          center: mapbox.feature.geometry.coordinates,
          zoom: onClickZoomLevel
        }
      },
      viewing: project
    });
  }

  render() {
    return (
      <div className="row">
        {/* The map filter section */}
        <div className="col-sm-4">
          <h1 className="display-4 mb-4">Civic Engagement Projects</h1>
          {/* For the cities in the projects, create a badge with a number representing how many projects occur in city */}
          {this.state.cityFilters && (
            <div className="my-3">
              {this.state.cityFilters.map((filter, i) => (
                <Button
                  variant="outline-dark"
                  key={filter + i}
                  className="mr-1"
                  size="sm"
                >
                  {filter.city} <Badge variant="light">{filter.count}</Badge>
                </Button>
              ))}
            </div>
          )}
          <Form.Group>
            <Form.Control
              id="feature-filter"
              type="text"
              placeholder="Search to filter"
              name="filter"
              onChange={this.onFilterChange}
              value={this.state.filter}
            />
          </Form.Group>

          {/* If the projects are loading, display it to the user */}
          {this.state.isLoading && <p className="text-muted">Loading...</p>}

          {/* If there is an error loading the projects, display it to the user */}
          {this.state.error && (
            <p className="text-danger">{this.state.error}</p>
          )}

          {/* If the projects are loaded, display them to the user in a list */}
          {this.state.projects && (
            <ListGroup
              className="mt-3"
              style={{
                maxHeight: "500px",
                marginBottom: "10px",
                overflow: "scroll"
              }}
            >
              {this.state.projects.map((project, i) => (
                <ListGroup.Item key={i} className="project-list">
                  <h3>{project.name}</h3>
                  <p className="font-weight-bold">
                    Managed by {project.owner.first} - {project.owner.email}
                  </p>
                  <p
                    className="text-muted"
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipses",
                      maxHeight: "4.5em"
                    }}
                  >
                    {project.description}
                  </p>
                  <Button onClick={() => this.projectBtnOnClick(project)}>
                    Click me
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>

        {/* The map */}
        <div
          className="col-sm-8"
          style={{
            minHeight: "800px",
            minWidth: "400px"
          }}
        >
          <MapView
            style="mapbox://styles/mapbox/streets-v9"
            containerStyle={{
              height: "100%",
              width: "100%"
            }}
            center={this.state.map.viewport.center}
            zoom={this.state.map.viewport.zoom}
            fitBounds={this.state.map.viewport.fitBounds}
            flyToOptions={{
              speed: 0.8
            }}
          >
            {/* Create symbol layer to store project pins */}
            <Layer
              type="symbol"
              id="marker"
              layout={{
                "icon-image": "castle-15"
              }}
            >
              {/* for each project, generate a feature */}
              {this.state.projects &&
                this.state.projects.map((project, i) => (
                  <Feature
                    key={i}
                    coordinates={[project.address.lat, project.address.lng]}
                    onClick={this.featureOnClick.bind(
                      this,
                      this.state.projects[i]
                    )}
                  />
                ))}
            </Layer>

            {/* Adding city boundries -- TODO: find way programmatic way to query city boundaries */}
            {/* </Layer> */}
            <MapContext.Consumer>
              {map => {
                map.addLayer({
                  id: "Chester",
                  type: "fill",
                  source: {
                    type: "geojson",
                    data: {
                      type: "Feature",
                      geometry: {
                        type: "MultiPolygon",
                        coordinates: [
                          [
                            [
                              [-75.409000000000006, 39.838000000000001],
                              [-75.412000000000006, 39.841999999999999],
                              [-75.412000000000006, 39.844999999999999],
                              [-75.409000000000006, 39.847999999999999],
                              [-75.400999999999996, 39.847000000000001],
                              [-75.397000000000006, 39.849000000000004],
                              [-75.391000000000005, 39.844999999999999],
                              [-75.390000000000001, 39.852000000000004],
                              [-75.388000000000005, 39.853999999999999],
                              [-75.382999999999996, 39.855000000000004],
                              [-75.379999999999995, 39.858000000000004],
                              [-75.379000000000005, 39.866999999999997],
                              [-75.379999999999995, 39.872],
                              [-75.382000000000005, 39.872999999999998],
                              [-75.382000000000005, 39.877000000000002],
                              [-75.376999999999995, 39.880000000000003],
                              [-75.373000000000005, 39.880000000000003],
                              [-75.369, 39.877000000000002],
                              [-75.361999999999995, 39.875999999999998],
                              [-75.358999999999995, 39.878],
                              [-75.353000000000009, 39.877000000000002],
                              [-75.352000000000004, 39.872],
                              [-75.349000000000004, 39.872],
                              [-75.344999999999999, 39.866999999999997],
                              [-75.343000000000004, 39.863],
                              [-75.343000000000004, 39.855000000000004],
                              [-75.338000000000008, 39.847000000000001],
                              [-75.340000000000003, 39.841999999999999],
                              [-75.355000000000004, 39.835000000000001],
                              [-75.387, 39.813000000000002],
                              [-75.388999999999996, 39.813000000000002],
                              [-75.397999999999996, 39.820999999999998],
                              [-75.400999999999996, 39.829000000000001],
                              [-75.403999999999996, 39.829000000000001],
                              [-75.406000000000006, 39.831000000000003],
                              [-75.409000000000006, 39.838000000000001]
                            ]
                          ]
                        ]
                      }
                    }
                  },
                  layout: {},
                  paint: {
                    "fill-color": "#088",
                    "fill-opacity": 0.8
                  }
                });
                map.addLayer({
                  id: "Swarthmore",
                  type: "fill",
                  source: {
                    type: "geojson",
                    data: {
                      type: "Feature",
                      geometry: {
                        type: "MultiPolygon",
                        coordinates: [
                          [
                            [
                              [-75.364000000000004, 39.907000000000004],
                              [-75.361000000000004, 39.913000000000004],
                              [-75.355000000000004, 39.914999999999999],
                              [-75.353999999999999, 39.917000000000002],
                              [-75.341999999999999, 39.917999999999999],
                              [-75.340000000000003, 39.917000000000002],
                              [-75.337000000000003, 39.910000000000004],
                              [-75.334000000000003, 39.907000000000004],
                              [-75.335000000000008, 39.899999999999999],
                              [-75.334000000000003, 39.895000000000003],
                              [-75.335000000000008, 39.893000000000001],
                              [-75.347999999999999, 39.884999999999998],
                              [-75.353000000000009, 39.887999999999998],
                              [-75.358999999999995, 39.887999999999998],
                              [-75.363, 39.890999999999998],
                              [-75.363, 39.895000000000003],
                              [-75.361000000000004, 39.896999999999998],
                              [-75.364000000000004, 39.898000000000003],
                              [-75.366, 39.901000000000003],
                              [-75.366, 39.905000000000001],
                              [-75.364000000000004, 39.907000000000004]
                            ]
                          ]
                        ]
                      }
                    }
                  },
                  layout: {},
                  paint: {
                    "fill-color": "#088",
                    "fill-opacity": 0.8
                  }
                });
              }}
            </MapContext.Consumer>

            {this.state.viewing && (
              // Allow for use of Mapbox-GL-js functionality not covered by react-mapbox-gl package
              // Use popup with close button
              <MapContext.Consumer>
                {map => {
                  var popup = new mapboxgl.Popup({ className: "popup" }) //{ closeOnClick: false }
                    .setLngLat([
                      this.state.viewing.address.lat,
                      this.state.viewing.address.lng
                    ])
                    .setHTML(
                      `<div style="${popupStyles}">
                              <p class="lead">${this.state.viewing.name}</p>
                              <p
                                class="text-muted"
                                style="
                                  overflow: hidden;
                                  text-overflow: ellipsis;
                                  max-height: 3.5rem
                                "
                              >
                                ${this.state.viewing.description}
                              </p>
                              <p>
                                <a href='#/projects/${this.state.viewing._id}' type="button" class="btn btn-info btn-sm btn-block">
                                  See more
                                </a>
                              </p>
                            </div>`
                    )
                    .addTo(map);
                }}
              </MapContext.Consumer>
            )}
          </MapView>
        </div>
      </div>
    );
  }
}

export default Map;
