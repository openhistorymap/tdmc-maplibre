# 3DModelCommons layer for Maplibre

usage: 


      var map = new maplibregl.Map({
                container: 'map', // container id
                style: 'https://api.maptiler.com/maps/positron/style.json?key=FWP3U2SNNqUqmFqOkifS', // style URL
                zoom: 16,
                hash: true,
                center: [2.294481, 48.85837]
            });

   
            map.on('style.load', () => {
                new TDMCLayer(map).prepareLayers().then(lyrs=>{
                    for (let lyr of lyrs){
                        map.addLayer(lyr);
                    }
                });
            });
