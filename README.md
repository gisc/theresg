# ThereSG

A one-stop public transport hub for Singapore: live bus arrivals, an MRT
journey planner with estimated fares, train and traffic alerts, platform crowd
levels, bicycle parking and park connectors, hawker centre listings, and
tourist attractions. Live at [www.there.sg](https://www.there.sg).

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

`NUXT_DATAMALL_API_KEY` must be set for the live data API routes. A push to
`main` rebuilds the Docker image through GitHub Actions; on the Olares host,
apply the new build with Settings > Applications > ThereSG > Stop, then
Resume.
