import type { FeatureCollection, Point } from 'geojson';
import type { BusStop } from './BusStop';

export type Geojson = FeatureCollection<Point, BusStop>;
