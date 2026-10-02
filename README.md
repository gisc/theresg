# ThereSG

Get around and experience Singapore.

ThereSG helps you discover places to go, food to try and things to do across
Singapore, then plan how to get there. It has grown beyond a transport hub
and tourist-attraction directory into a site for everyday outings and local
experiences, from parks and libraries to hawker food, neighbourhood activities
and performances.

Visit [www.there.sg](https://www.there.sg).

## Explore Singapore

- **Places:** Find parks, libraries and attractions, with location details,
  official visit information and transport options where available.
- **Food:** Explore hawker centres, local food culture and places to eat.
- **Events:** Browse official calendars for library programmes, neighbourhood
  activities, park events, garden concerts and performances. Check dates, fees and
  registration on the official sites; this is not a combined live event feed.
- **Commute:** Plan bus, MRT and walking journeys to support your outings,
  with estimated MRT fares and mapped walking approaches where supported.
- **Bus and MRT:** Check live bus arrivals, station crowd levels and train
  service information.
- **Bike and Alerts:** Find bicycle parking and park connectors, and check
  service and traffic updates.

Transport remains part of ThereSG, helping connect the places and experiences
rather than defining the whole site. Coverage varies: walking connections are
not available for every destination, and map-estimated routes are not verified
step-free access routes.

## Credits and licence

ThereSG started as a fork of
[TransitSG](https://github.com/ingStudiosOfficial/transitsg) by ingStudios,
used under the [Apache License 2.0](LICENSE) (the upstream repository has no
NOTICE file). This fork has been substantially modified and extended since
September 2026: renamed to ThereSG, redesigned, and expanded with new
sections, a server API layer, and features beyond the original codebase.
Check out the original at
[transitsg.ingstudios.dev](https://transitsg.ingstudios.dev).

ThereSG is built with the help of AI tools.

## Data attribution

- Contains information from [OneMap](https://www.onemap.gov.sg) (postal code search and walking routes) (c) Singapore Land Authority, accessed on 2 October 2026 from onemap.gov.sg, which is made available under the terms of the [Singapore Open Data Licence version 1.0](https://www.onemap.gov.sg/legal/opendatalicence.html).
- Contains information from [LTA DataMall](https://datamall.lta.gov.sg)
  accessed on 26 September 2026 from datamall.lta.gov.sg which is made
  available under the terms of the
  [Singapore Open Data Licence version 1.0](https://data.gov.sg/open-data-licence).
  Live feeds are fetched from LTA DataMall in near real time.
- Contains information from
  [NParks Tracks](https://data.gov.sg/datasets/d_306cc1018cb733346681883ee6d73054/view)
  accessed on 28 September 2026 from data.gov.sg which is made available
  under the terms of the Singapore Open Data Licence version 1.0.
- Hawker centre listings from
  [NEA's directory of markets & hawker centres](https://www.nea.gov.sg/docs/default-source/hawker-centres-documents/list-of-hcs_-17-august-2026.pdf)
  (PDF, 17 August 2026).
- Walking distances on /all are precomputed (`scripts/build-walk-links.py`, output `public/walk-links.json`) from
  [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors' footpaths and roads (BBBike Singapore extract, 26 Sep 2026), ODbL.
- Maps by [OpenFreeMap](https://openfreemap.org) ©
  [OpenMapTiles](https://www.openmaptiles.org/), with data from
  [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.

ThereSG is not affiliated with or endorsed by LTA, NEA, NParks or any
government agency.

## Development

```bash
npm install
npm run dev
```

`NUXT_DATAMALL_API_KEY` must be set for the live data API routes. Postal code lookup needs `NUXT_ONEMAP_EMAIL` and `NUXT_ONEMAP_PASSWORD` (a free OneMap API account); without them it reports postal codes as unavailable. A push to
`main` rebuilds the Docker image through GitHub Actions; on the Olares host,
apply the new build with Settings > Applications > ThereSG > Stop, then
Resume.
