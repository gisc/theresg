<template>
	<footer class="data-credits">
		<p>
			Contains information from
			<a href="https://datamall.lta.gov.sg" target="_blank" rel="noopener">LTA DataMall</a>
			accessed on 26 September 2026 from datamall.lta.gov.sg which is made available
			under the terms of the
			<a href="https://data.gov.sg/open-data-licence" target="_blank" rel="noopener"
				>Singapore Open Data Licence version 1.0</a
			>. Live feeds are fetched from LTA DataMall in near real time.
		</p>
		<p>
			Contains information from
			<a
				href="https://data.gov.sg/datasets/d_306cc1018cb733346681883ee6d73054/view"
				target="_blank"
				rel="noopener"
				>NParks Tracks</a
			>
			accessed on 28 September 2026 from data.gov.sg which is made available under the
			terms of the Singapore Open Data Licence version 1.0.
		</p>
		<p>
			Contains information from
			<a href="https://www.onemap.gov.sg" target="_blank" rel="noopener">OneMap</a>
			(postal code search and walking routes) &copy; Singapore Land Authority, accessed on 2
			October 2026 from onemap.gov.sg, which is made available under the terms of the
			<a href="https://www.onemap.gov.sg/legal/opendatalicence.html" target="_blank" rel="noopener"
				>Singapore Open Data Licence version 1.0</a
			>.
		</p>
		<p>
			Hawker centre listings from
			<a
				href="https://www.nea.gov.sg/docs/default-source/hawker-centres-documents/list-of-hcs_-17-august-2026.pdf"
				target="_blank"
				rel="noopener"
				>NEA's directory of markets &amp; hawker centres</a
			>
			(PDF, 17 August 2026).
		</p>
		<p>
			Maps by <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>
			©
			<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a>,
			with data from
			<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener"
				>OpenStreetMap</a
			>
			contributors.
		</p>
		<p>
			ThereSG is not affiliated with or endorsed by LTA, NEA, NParks, SLA or any government
			agency.
		</p>
	</footer>
</template>

<style lang="css" scoped>
.data-credits {
	margin-top: 18px;
	padding: 12px 2px 4px;
	border-top: 1px solid var(--md-sys-color-surface-variant);
	font-size: 11.5px;
	line-height: 1.55;
	color: var(--md-sys-color-on-surface-variant);
}

.data-credits p {
	margin: 0 0 6px;
}

.data-credits p:last-child {
	margin-bottom: 0;
}

.data-credits a {
	color: var(--sg-brand-text);
	text-decoration: none;
}

.data-credits a:hover {
	text-decoration: underline;
}
</style>
