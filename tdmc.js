

            class TDMCLayer{
                map;
                layers = [];
                constructor(map) {
                    this.map = map;
                }
                THREE = window.THREE;
                async prepareLayers(filters){
                    return fetch('https://www.3dmodelcommons.com/api/points.geojson').then(async features=>{
                        const feats = await features.json();
                        console.log(feats);
                        for (let feature of feats.features){
                        
                            
                            /* Correct georeferencing of the model */
                            const modelOrigin = feature.geometry.coordinates;
                            const modelAltitude = feature.properties.alt;
                            const modelRotate = [Math.PI * feature.properties.rot_x, Math.PI*feature.properties.rot_y, Math.PI*feature.properties.rot_z];

                            const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
                                modelOrigin,
                                modelAltitude
                            );

                            /* Transformation parameters according to previously calculated elements */
                            const modelTransform = {
                                translateX: modelAsMercatorCoordinate.x,
                                translateY: modelAsMercatorCoordinate.y,
                                translateZ: modelAsMercatorCoordinate.z,
                                rotateX: modelRotate[0],
                                rotateY: modelRotate[1],
                                rotateZ: modelRotate[2],
                                /* Since our 3D model is in real world meters, a scale transform needs to be
                                * applied since the CustomLayerInterface expects units in MercatorCoordinates.
                                */
                                scale:modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()*feature.properties.scale
                            };

                            /* And now we calculate the layers */
                            const lyr = {
                                id: feature.id,
                                type: 'custom', 
                                renderingMode: '3d', // we get the 3D canvas from Maplibre
                                onAdd (map, gl) {
                                    this.camera = new THREE.Camera();
                                    this.scene = new THREE.Scene();
                        
                                    // create two three.js lights to illuminate the model
                                    const directionalLight = new THREE.DirectionalLight(0xffffff);
                                    directionalLight.position.set(30, -70, 100).normalize();
                                    this.scene.add(directionalLight);
                                    
                                    const directionalLight2 = new THREE.DirectionalLight(0xffffff);
                                    directionalLight2.position.set(30, 70, 100).normalize();
                                    this.scene.add(directionalLight2);
                        
                                    if(feature.properties.format === "gltf"){
                                        // use the three.js GLTF loader to add the 3D model to the three.js scene
                                        const loader = new THREE.GLTFLoader();
                                        loader.load(
                                            feature.properties.url,
                                            (gltf) => {
                                                this.scene.add(gltf.scene);
                                            }
                                        );
                                    } else {
                                        // prepare mesh material
                                        const material = new THREE.MeshPhysicalMaterial({
                                            color: 0xb2ffc8,
                                            //envMap: envTexture,
                                            metalness: 0.25,
                                            roughness: 0.1,
                                            opacity: 1.0,
                                            transparent: true,
                                            transmission: 0.99,
                                            clearcoat: 1.0,
                                            clearcoatRoughness: 0.25
                                        })
                                        // use the three.js STL loader to add the 3D model to the three.js scene
                                        const loader = new THREE.STLLoader();
                                        loader.load(
                                            feature.properties.url,
                                            (stl) => {
                                                const mesh = new THREE.Mesh(stl, material)
                                                this.scene.add(mesh);
                                            },
                                            (xhr) => {
                                                console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
                                            },
                                            (error) => {
                                                console.log(error)
                                            }
                                        );
                                    }
                                    this.map = map;
                        
                                    // use the MapLibre GL JS map canvas for three.js
                                    this.renderer = new THREE.WebGLRenderer({
                                        canvas: map.getCanvas(),
                                        context: gl,
                                        antialias: true
                                    });
                        
                                    this.renderer.autoClear = false;
                                },
                                render (gl, matrix) {
                                    const rotationX = new THREE.Matrix4().makeRotationAxis(
                                        new THREE.Vector3(1, 0, 0),
                                        modelTransform.rotateX
                                    );
                                    const rotationY = new THREE.Matrix4().makeRotationAxis(
                                        new THREE.Vector3(0, 1, 0),
                                        modelTransform.rotateY
                                    );
                                    const rotationZ = new THREE.Matrix4().makeRotationAxis(
                                        new THREE.Vector3(0, 0, 1),
                                        modelTransform.rotateZ
                                    );
                        
                                    const m = new THREE.Matrix4().fromArray(matrix);
                                    const l = new THREE.Matrix4()
                                        .makeTranslation(
                                            modelTransform.translateX,
                                            modelTransform.translateY,
                                            modelTransform.translateZ
                                        )
                                        .scale(
                                            new THREE.Vector3(
                                                modelTransform.scale,
                                                -modelTransform.scale,
                                                modelTransform.scale
                                            )
                                        )
                                        .multiply(rotationX)
                                        .multiply(rotationY)
                                        .multiply(rotationZ);
                        
                                    this.camera.projectionMatrix = m.multiply(l);
                                    this.renderer.resetState();
                                    this.renderer.render(this.scene, this.camera);
                                    this.map.triggerRepaint();
                                }
                            }
                            this.layers.push(lyr);
                        
                        }
                        return this.layers;
                    });
                }
                getLayer(){
                    return this.layer;
                }
            }
            
