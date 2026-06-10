# OpenShift Deploy Commands For 90f Using oc

App URL:

```powershell
http://90f-90f-dev.apps-crc.testing
```

This runbook deploys the project to OpenShift from GitHub, not from the local folder. The OpenShift `BuildConfig` pulls source from:

```txt
https://github.com/quangchu94/90f.git
```

Branch:

```txt
main
```

GitHub secret used by OpenShift:

```txt
github-openshift-local-token
```

The commands below use the full `oc.exe` path available on this machine:

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe
```

If `oc` is already in `PATH`, you can replace `C:\Users\steve\.crc\bin\oc\oc.exe` with `oc`.

## 1. Check OpenShift Login And Project

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe whoami
```

Shows the logged-in OpenShift user.

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe project -q
```

Shows the current OpenShift project/namespace. This deployment expects:

```txt
90f-dev
```

If needed, switch to the correct project:

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe project 90f-dev
```

Selects project `90f-dev` as the target namespace for all following commands.

## 2. Check Required Secret

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get secret github-openshift-local-token
```

Verifies that the GitHub credential secret exists in the project.

This secret is referenced by `BuildConfig/90f` in `openshift/90f.yaml`:

```yaml
sourceSecret:
  name: github-openshift-local-token
```

OpenShift uses this secret when cloning the GitHub repository.

## 3. Apply OpenShift Resources

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe apply -f .\openshift\90f.yaml
```

Creates or updates all resources described in `openshift/90f.yaml`:

- `ImageStream/90f`
- `BuildConfig/90f`
- `Deployment/90f`
- `Service/app-90f`
- `Route/90f`

Important resource meanings:

- `ImageStream/90f`: tracks the app image inside the OpenShift internal registry.
- `BuildConfig/90f`: tells OpenShift how to build the image from GitHub using the Dockerfile.
- `Deployment/90f`: runs the app containers. Current config uses `replicas: 2`, so the app runs on 2 pods.
- `Service/app-90f`: internal stable address that load-balances traffic to the pods.
- `Route/90f`: public HTTP route for browser access.

## 4. Start A Build From GitHub

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe start-build 90f --follow
```

Starts a new OpenShift Docker build from the GitHub repository configured in `BuildConfig/90f`.

`--follow` streams the build logs until the build finishes.

The build flow is:

1. OpenShift clones `https://github.com/quangchu94/90f.git`, branch `main`.
2. OpenShift uses `github-openshift-local-token` for GitHub access.
3. OpenShift runs the project `Dockerfile`.
4. The Dockerfile builds the Vite app with Node.
5. The Dockerfile copies the built `dist` folder into nginx.
6. OpenShift pushes the final image to the internal registry as `90f:latest`.

## 5. Check Build Status

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get builds --selector=buildconfig=90f
```

Lists builds created from `BuildConfig/90f`.

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get build <build-name>
```

Checks one build, for example:

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get build 90f-1
```

Expected successful status:

```txt
Complete
```

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe logs build/<build-name>
```

Shows the build log for a specific build.

Example:

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe logs build/90f-1
```

Use this when a build fails or you want to inspect the Docker build output.

## 6. Check The Built Image

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get imagestreamtag 90f:latest
```

Confirms that OpenShift pushed the latest app image into the internal registry.

The image used by the deployment is:

```txt
image-registry.openshift-image-registry.svc:5000/90f-dev/90f:latest
```

Meaning:

- `image-registry.openshift-image-registry.svc:5000`: OpenShift internal image registry.
- `90f-dev`: project/namespace.
- `90f`: image stream name.
- `latest`: image tag created by the latest successful build.

## 7. Restart Deployment To Pull The Latest Image

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe rollout restart deployment/90f
```

Restarts the app deployment so the pods pull the newest `90f:latest` image.

This is important because the current app uses Kubernetes `Deployment`, not OpenShift `DeploymentConfig` image-change triggers.

## 8. Wait For Rollout

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe rollout status deployment/90f --timeout=120s
```

Waits until the deployment finishes rolling out.

Expected successful output:

```txt
deployment "90f" successfully rolled out
```

## 9. Verify Two Running Pods

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get deployment 90f
```

Checks desired and available replicas.

Expected result:

```txt
READY   UP-TO-DATE   AVAILABLE
2/2     2            2
```

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get pods --selector=app=90f -o wide
```

Lists the app pods. Expected: 2 pods with `READY` value `1/1` and `STATUS` value `Running`.

## 10. Verify Service And Route

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get service app-90f
```

Checks the internal service that sends traffic to the app pods.

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get endpoints app-90f
```

Checks whether the service has pod endpoints.

With 2 pods, expected endpoints look like:

```txt
10.217.0.98:8080,10.217.0.99:8080
```

```powershell
C:\Users\steve\.crc\bin\oc\oc.exe get route 90f
```

Shows the public OpenShift route.

Expected host:

```txt
90f-90f-dev.apps-crc.testing
```

## 11. Smoke Test The App

```powershell
Invoke-WebRequest -UseBasicParsing http://90f-90f-dev.apps-crc.testing
```

Calls the app route from the local machine.

Expected result:

```txt
StatusCode: 200
```

```powershell
Invoke-WebRequest -UseBasicParsing "http://90f-90f-dev.apps-crc.testing/api/espn/site/sports/soccer/fifa.world/scoreboard?dates=20260621"
```

Calls one ESPN proxy endpoint through nginx.

Expected result when ESPN/network is reachable:

```txt
StatusCode: 200
```

## Current Deployment Shape

Current `openshift/90f.yaml` deploys:

- Git source: `https://github.com/quangchu94/90f.git`
- Branch: `main`
- GitHub secret: `github-openshift-local-token`
- Build output: `ImageStreamTag/90f:latest`
- Runtime image: `image-registry.openshift-image-registry.svc:5000/90f-dev/90f:latest`
- Deployment replicas: `2`
- Service: `app-90f`, port `8080`
- Route: `http://90f-90f-dev.apps-crc.testing`
