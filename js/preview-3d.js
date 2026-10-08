let scene, camera, renderer, capeMesh, elytraLeftMesh, elytraRightMesh, capeTexture;
let isElytraActive = false;

function init3DPreview() {
    const container = document.getElementById('canvas3dContainer');
    if (!container) return;

    scene = new THREE.Scene();

    // Background Sky
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgzFwTXTfkL6b07Y8ga1RfMOJOfsh0ph7lwVR6klcoEpfdfqnMrX5-fho&s=10', function(texture) {
        scene.background = texture;
    });

    // Camera Setup
    camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 65);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;

    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(15, 30, 25);
    scene.add(dirLight);

    // Player Model
    const steveGroup = new THREE.Group();

    const steveCanvas = document.createElement('canvas');
    steveCanvas.width = 64; steveCanvas.height = 64;
    const sCtx = steveCanvas.getContext('2d');
    sCtx.fillStyle = '#1c7467'; sCtx.fillRect(0, 0, 64, 64);
    sCtx.fillStyle = '#2d3d75'; sCtx.fillRect(0, 32, 64, 32);
    sCtx.fillStyle = '#c08960'; sCtx.fillRect(0, 0, 32, 16);
    
    const steveTex = new THREE.CanvasTexture(steveCanvas);
    steveTex.magFilter = THREE.NearestFilter;
    const steveMat = new THREE.MeshStandardMaterial({ map: steveTex });

    const head = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 8), steveMat); head.position.y = 10;
    const body = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 4), steveMat); body.position.y = 0;
    const armL = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), steveMat); armL.position.set(-6, 0, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), steveMat); armR.position.set(6, 0, 0);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), steveMat); legL.position.set(-2, -12, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), steveMat); legR.position.set(2, -12, 0);
    steveGroup.add(head, body, armL, armR, legL, legR);

    // Cape Texture Setup - HD Linear Filtering for HD/4K look
    const canvasElement = document.getElementById('capeCanvas');
    capeTexture = new THREE.CanvasTexture(canvasElement);
    capeTexture.magFilter = THREE.LinearFilter;
    capeTexture.minFilter = THREE.LinearFilter;
    capeTexture.generateMipmaps = true;

    const capeMat = new THREE.MeshStandardMaterial({ 
        map: capeTexture, 
        side: THREE.DoubleSide, 
        transparent: true,
        roughness: 0.4
    });

    const capeGeo = new THREE.BoxGeometry(10, 16, 0.5);
    capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.geometry.translate(0, -8, 0);
    capeMesh.position.set(0, 6, -2.3);
    steveGroup.add(capeMesh);

    // Elytra Mode Setup
    const wingGeo = new THREE.BoxGeometry(5, 14, 0.5);
    wingGeo.translate(0, -7, 0);
    
    elytraLeftMesh = new THREE.Mesh(wingGeo, capeMat);
    elytraRightMesh = new THREE.Mesh(wingGeo, capeMat);
    
    elytraLeftMesh.position.set(-1, 5, -2.5);
    elytraLeftMesh.rotation.set(0.2, 0.4, -0.2);
    elytraRightMesh.position.set(1, 5, -2.5);
    elytraRightMesh.rotation.set(0.2, -0.4, 0.2);

    elytraLeftMesh.visible = false;
    elytraRightMesh.visible = false;

    steveGroup.add(elytraLeftMesh, elytraRightMesh);
    scene.add(steveGroup);

    // 60FPS Live Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        let clock = Date.now() * 0.003;

        if (!isElytraActive && capeMesh) {
            capeMesh.rotation.x = Math.sin(clock) * 0.08 + 0.15;
        } else if (elytraLeftMesh && elytraRightMesh) {
            elytraLeftMesh.rotation.z = Math.sin(clock) * 0.05 - 0.2;
            elytraRightMesh.rotation.z = -Math.sin(clock) * 0.05 + 0.2;
        }

        if (capeTexture) {
            capeTexture.needsUpdate = true;
        }

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function updatePlayerCapeTexture(canvas) {
    if (capeTexture) {
        capeTexture.image = canvas;
        capeTexture.needsUpdate = true;
    }
}

window.update3dCapeTexture = updatePlayerCapeTexture;
window.updatePlayerCapeTexture = updatePlayerCapeTexture;

function toggleElytraMode(enabled) {
    isElytraActive = enabled;
    if (capeMesh) capeMesh.visible = !enabled;
    if (elytraLeftMesh) elytraLeftMesh.visible = enabled;
    if (elytraRightMesh) elytraRightMesh.visible = enabled;
}

window.addEventListener('DOMContentLoaded', () => {
    init3DPreview();
});