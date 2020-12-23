# R7viz
R7viz is a protocol that integrates front-end & back-end, which show autonomous driving data in real time.
  



## Overview 
[1. Development Environment](#1)  
[2. Key Features](#2)  
[3. Diagram](#3)  
[4. Installing Dependecy](#4)  
[5. ](#5)  
[6. ](#6)  
[7. References](#7)

## 1. Development Environment <a id="1"></a>
- OS : Ubuntu 18.04 LTS
- Processor : Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz
- Mainboard : PRIME Z390-A
- RAM : 64GB
- GPU : GeForce GTX TITAN X
- Tool : Visual Studio Code
- Language : Javascript, CSS, HTML, ros-melodic
  
## 2. Key Features <a id="2"></a>
- Visualization of Camera Data
- Visualization of Lidar data
- Visualization of Velocity data
- Visualization of Acceleration Data
- Localization
- Direction of object
- Bounding box of object
- Data labeling of object
- HD Map
- Change View Mode
- Measurement of frame per second

## 3. Diagram <a id="3"></a>
  
![alt 2번이미지](/photo/diagram_r7viz.png)
  
### Components
- DGIST rosbag: a collection of sensor data obtained from DGIST self-driving vehicles
- rosbridge server: web servers accepting rostopic
- xviz converter: module that transforms the rostopic data in xviz format
- rosbridge-xviz-connector: XVIZ protocol data proxy server produced by the University of Toronto, Canada
- mapbox.com: Open Source Maps
- Map Source Selection: module that allows you to specify map box token and map style
- HD Map (GeoJson): DGIST's HD Map osm format files separated by lane and center line
- Web UI: Web-based UI customizing Uber's open source Streetscape.gl
  
## 4. Installing Dependency <a id="4"></a>
  
1) ros-bridge
```cmd
$ sudo apt-get install ros-melodic-rosbridge-server
$ source /opt/ros/melodic/setup.bash
$ roslaunch rosbridge_server rosbridge_websocket.launch
```
2)


  
## 7. References <a id="7"></a>
- [AVS](https://avs.auto)
- [XVIZ](https://github.com/uber/xviz)
- [Streetscape.gl](https://github.com/uber/streetscape.gl)
- [Autoronto GUI](https://github.com/leonzz/argus-autoronto)
- [Ford Autonomous Trucks HMI](https://github.com/aliekingurgen/ford-autonomous-vehicles-hmi)
- [Rosbridge_suite](https://github.com/RobotWebTools/rosbridge_suite)
