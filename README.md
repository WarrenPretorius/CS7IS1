# CS7IS1
Knowledge &amp; Data Engineering Project; Uplifiting F1 Data into RDF

## Let's add some details here ##

### 10 Queries: ###  
Which driver won race Y in season X ?
Which constructor won the Y race in season X?
Which circuit had the fastest lap time in season X?
Which driver recorded the slowest lap time in year X ?
What was the slowest lap time in year / season X?
Which driver won the most races in season Y?
Which driver won the championship in season X?
Which constructor won the championship in season Y?
Which driver got the most pole  positions in season Y?
Which constructor got the most pole positions in season Y?



### 13 Classes: ###  
```
    http://example.org/f1/DriverStandings
    http://example.org/f1/LapTimes
    http://example.org/f1/Results
    http://example.org/f1/Qualifying
    http://example.org/f1/ConstructorStandings
    http://example.org/f1/ConstructorResults
    http://example.org/f1/PitStops
    http://example.org/f1/Driver
    http://example.org/f1/Race
    http://example.org/f1/Status
    http://example.org/f1/Constructor
    http://example.org/f1/Circuit
    http://example.org/f1/Season
```

### 49+ Properties: ###  
```
    http://example.org/f1/driverid
    http://example.org/f1/driverstandingsid
    http://example.org/f1/points
    http://example.org/f1/position
    http://example.org/f1/raceid
    http://example.org/f1/wins
    http://example.org/f1/lap
...
```


# Loading TripleStore
## Setting Up Stardog

Follow the StarDog [documnentation](https://www.stardog.com/docs) to create a local stardog server.

1. Start Server
```
stardog-admin server start --disable-security
```
2. (Optional) If querying to graph database externally, tunnel localhost port
```
./ngrok http 5820
```
3. Load database through interface using `full_output_2.ttl`

4. Get querying! **Existing Sampel Queries in** `SPARQL_F1_queries`

## Explore Formula 1 Ontology Visually

Go to [WebOwl Visual](http://www.visualdataweb.de/webvowl/) and Upload file `f1_w_restrictions.owl` to visualise ontology.

![F1 Ontology](https://github.com/WarrenPretorius/CS7IS1/vis_f1_ont.png)

## Ontology Documentation 
Documentation of Ontology is done using Widoco. Output files are in `F1_Ontology_Documentation/` folder.


## Create Ontologies for Following Datasets by Friday (15th Nov)
[WebProtege](https://webprotege.stanford.edu/#projects/2e5544cc-84f2-487a-890d-ccf4db1f22b2/edit/Properties?selection=ObjectProperty(%3Chttp://webprotege.stanford.edu/RC23hE9n0WvGKp9wvHw9ukg%3E))

| Name        | Datasets |
| ------------- |:-------------:|
| Rob     | circuits, lapTimes, pitStops |
| Uzair    | constructor, constructorsStandings, constructorsResults  |
| Sophie |   drivers,driverStandings, results  |
| Dhruv | races, seasons |
| Warren | status, qualifying |

